// web project login.go
package http_server

import (
	"common"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
)

var (
	logger *log.Logger
	route  = map[string]func(http.ResponseWriter, *http.Request){
		"/":         helloServer,
		"/login":    login,
		"/register": register,
		"/query":    query,
		"/modify":   modifyPlans,
		"/checkin":  checkIn,
	}
)

func StartServer(addr, webPath string, l *log.Logger) {
	logger = l

	serve := http.NewServeMux()
	for path, handler := range route {
		serve.HandleFunc(path, handler)
	}
	serve.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir(webPath))))
	serve.Handle("/fonts/", http.StripPrefix("/fonts/", http.FileServer(http.Dir(webPath))))
	serve.Handle("/image/", http.StripPrefix("/image/", http.FileServer(http.Dir(webPath))))
	serve.Handle("/scripts/", http.StripPrefix("/scripts/", http.FileServer(http.Dir(webPath))))

	logger.Println("start http server", addr)
	logger.Println(http.ListenAndServe(addr, serve))
}

func helloServer(w http.ResponseWriter, req *http.Request) {
	io.WriteString(w, time.Now().UTC().String())
}

func login(w http.ResponseWriter, req *http.Request) {
	req.ParseForm()
	logger.Println("login", req)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId := req.FormValue("user_id")
	uid, _ := strconv.ParseInt(userId, 10, 64)
	if uid <= 0 {
		response["errorno"] = -1
		response["msg"] = fmt.Sprintf("Param user_id:%s is error!", userId)
		return
	}

	err, results := queryUser(uid)
	if results != nil {
		defer results.Close()
	}

	if err != nil {
		response["errorno"] = -2
		response["msg"] = "Login error. " + err.Error()
	} else if !results.Next() {
		response["errorno"] = -3
		response["msg"] = "Login error. No user id: " + userId
	} else {
		response["errorno"] = 0
		response["msg"] = "Login success. id: " + userId
	}
}

func register(w http.ResponseWriter, req *http.Request) {
	req.ParseForm()
	logger.Println("register", req)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	name := req.FormValue("name")
	if len(name) == 0 {
		response["errorno"] = -1
		response["msg"] = "Param name is null!"
		return
	}

	err, id := insertUser(name)
	if err != nil {
		response["errorno"] = -2
		response["msg"] = "Register error. " + err.Error()
		return
	}

	response["errorno"] = 0
	response["id"] = id
}

func query(w http.ResponseWriter, req *http.Request) {
	req.ParseForm()
	logger.Println("query", req)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId := req.FormValue("user_id")
	uid, _ := strconv.ParseInt(userId, 10, 64)

	// uid = 0 means only query all users' data.
	// query plans. TODO: client not support query all users' plans.
	if uid > 0 {
		err, plans := queryPlans(uid)
		if err != nil {
			response["errorno"] = -2
			response["msg"] = "Query plans error. " + err.Error()
			return
		}

		responsePlans := make(map[string]([]map[string]interface{}))
		response["plans"] = responsePlans
		if plans != nil {
			defer plans.Close()

			for plans.Next() {
				var planUserId, planId int64
				var content, plan string
				if err := plans.Scan(&planUserId, &planId, &content, &plan); err != nil {
					logger.Println("Scan plans fail! user_id:" + userId)
					continue
				}

				userIdStr := strconv.FormatInt(planUserId, 10)
				array, ok := responsePlans[userIdStr]
				if !ok {
					array = make([]map[string]interface{}, 0)
					responsePlans[userIdStr] = array
				}

				p := make(map[string]interface{})
				p["plan_id"] = planId
				p["content"] = content
				p["plan"] = plan
				array = append(array, p)
			}
		}
	}

	// query records
	date := req.FormValue("date")
	if len(date) == 0 {
		response["errorno"] = 0
		return
	}

	err, records := queryRecords(uid)
	if err != nil {
		response["errorno"] = -3
		response["msg"] = "Query records error. " + err.Error()
		return
	}

	responseRecords := make(map[string]([]map[string]interface{}))
	response["records"] = responseRecords
	if records != nil {
		defer records.Close()

		for records.Next() {
			var recordUserId, planId, checkInTime, recordTime int64
			var content, plan string
			if err := records.Scan(&recordUserId, &planId, &content, &plan, &checkInTime, &recordTime); err != nil {
				logger.Println("Scan records fail! id:" + userId)
				continue
			}

			userIdStr := strconv.FormatInt(recordUserId, 10)
			array, ok := responseRecords[userIdStr]
			if !ok {
				array = make([]map[string]interface{}, 0)
				responseRecords[userIdStr] = array
			}

			r := make(map[string]interface{})
			r["plan_id"] = planId
			r["content"] = content
			r["plan"] = plan
			r["checkin_time"] = checkInTime
			r["record_time"] = recordTime
			array = append(array, r)
		}
	}

	// success
	response["errorno"] = 0
}

func modifyPlans(w http.ResponseWriter, req *http.Request) {
	req.ParseForm()
	logger.Println("modifyPlans", req)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId := req.FormValue("user_id")
	uid, _ := strconv.ParseInt(userId, 10, 64)
	if uid <= 0 {
		response["errorno"] = -1
		response["msg"] = fmt.Sprintf("Param user_id:%s is error!", userId)
		return
	}

	data := req.FormValue("data")
	if len(data) == 0 {
		response["errorno"] = -1
		response["msg"] = "No plan is changed!"
		return
	}

	plans := make([]map[string]interface{}, 0)
	if err := json.Unmarshal([]byte(data), &plans); err != nil {
		response["errorno"] = -2
		response["msg"] = "Plan data json unmarshal failed! " + err.Error()
		return
	}

	for _, v := range plans {
		opt, _ := v["opt"].(string)
		if opt == "DEL" {
			planId, _ := v["plan_id"].(float64)
			if e := deletePlan(uid, int64(planId)); e != nil {
				logger.Println(e.Error())
			}
		} else if opt == "ADD" {
			content, _ := v["content"].(string)
			plan, _ := v["plan"].(string)

			if e, _ := insertPlan(uid, content, plan); e != nil {
				logger.Println(e.Error())
			}
		}
	}

	response["errorno"] = 0
}

func checkIn(w http.ResponseWriter, req *http.Request) {
	req.ParseForm()
	logger.Println("checkIn", req)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId := req.FormValue("user_id")
	uid, _ := strconv.ParseInt(userId, 10, 64)
	if uid <= 0 {
		response["errorno"] = -1
		response["msg"] = fmt.Sprintf("Param user_id:%s is error!", userId)
		return
	}

	data := req.FormValue("data")
	if len(data) == 0 {
		response["errorno"] = -1
		response["msg"] = "No checkIn!"
		return
	}

	records := make(map[string]interface{})
	if err := json.Unmarshal([]byte(data), &records); err != nil {
		response["errorno"] = -2
		response["msg"] = "Record data json unmarshal failed! " + err.Error()
		return
	}

	beignTime, _ := records["begin_time"].(float64)
	begin := int64(beignTime)
	endTime, _ := records["end_time"].(float64)
	end := int64(endTime)
	planIds, _ := records["plan_ids"].([]interface{})

	if begin <= 0 || end <= 0 || len(planIds) == 0 {
		response["errorno"] = -3
		response["msg"] = fmt.Sprintf("Checkin params error! begin:%d end:%d plan_ids:%d", begin, end, len(planIds))
		return
	}

	// convert plan_id from interface{} to int64
	ids := make([]int64, 0)
	for _, planId := range planIds {
		id, _ := planId.(float64)
		if int64(id) > 0 {
			ids = append(ids, int64(id))
		}
	}

	for i := begin; i <= end; i = i + 24*60*60 {
		for _, plan_id := range ids {
			insertRecord(uid, plan_id, i)
		}
	}

	response["errorno"] = 0
}

func responseJsonToString(response map[string]interface{}) string {
	if msg, err := json.Marshal(response); err == nil {
		return "{}"
	} else {
		return string(msg)
	}
}

func queryUser(userId int64) (err error, results *sql.Rows) {
	err, results = common.QueryTable([]string{"1"}, "`tbl_user`", []*common.KeyValue{&common.KeyValue{"`user_id`", userId}}, nil, "", nil)
	return
}

func queryPlans(userId int64) (err error, results *sql.Rows) {
	where := make([]*common.KeyValue, 0)
	if userId > 0 {
		where = append(where, &common.KeyValue{"`user_id`", userId})
	}
	where = append(where, &common.KeyValue{"NOW() between `begin_time` and `end_time`", nil})

	err, results = common.QueryTable([]string{"`user_id`", "`plan_id`", "`content`", "`plan`"},
		"`tbl_plans`", where, nil, "", []string{"`user_id`", "`plan_id`"})
	return
}

func queryRecords(userId int64) (err error, results *sql.Rows) {
	where := make([]*common.KeyValue, 0)
	if userId > 0 {
		where = append(where, &common.KeyValue{"`user_id`", userId})
	}

	err, results = common.QueryTable(
		[]string{"a.`user_id`", "a.`plan_id`", "b.`content`", "b.`plan`",
			"UNIX_TIMESTAMP(a.`checkin_time`) as `checkin_time`",
			"UNIX_TIMESTAMP(a.`record_time`) as `record_time`"},
		"`tbl_records` a LEFT JOIN `tbl_plans` b ON a.`plan_id` = b.`plan_id`",
		where, nil, "",
		[]string{"a.`user_id`", "a.`plan_id`", "a.`checkin_time`"})
	return
}

func insertUser(name string) (err error, userId int64) {
	if len(name) == 0 {
		err = errors.New(fmt.Sprintf("insertUser params error! name:%s;", name))
		return
	}

	err, userId = common.InsertTable("`tbl_user`", map[string]interface{}{"`name`": name}, nil)
	return
}

func insertPlan(userId int64, content, plan string) (err error, planId int64) {
	if userId <= 0 || len(content) == 0 || len(plan) == 0 {
		err = errors.New(fmt.Sprintf("insertPlan params error! userId:%d; content:%s; plan:%s;", userId, content, plan))
		return
	}

	err, planId = common.InsertTable("`tbl_plans`", map[string]interface{}{
		"`user_id`": userId,
		"`content`": content,
		"`plan`":    plan,
	}, nil)
	return
}

func insertRecord(userId, planId, checkInTime int64) (err error, recordId int64) {
	if userId <= 0 || planId <= 0 || checkInTime <= 0 {
		err = errors.New(fmt.Sprintf("insertRecord params error! userId:%d; planId:%d; checkInTime:%d;", userId, planId, checkInTime))
		return
	}

	err, recordId = common.InsertTable("`tbl_records`", map[string]interface{}{
		"`user_id`":      userId,
		"`plan_id`":      planId,
		"`checkin_time`": fmt.Sprintf("FROM_UNIXTIME(%d)", checkInTime),
	}, map[string]interface{}{
		"`record_time`": "NOW()",
	})
	return
}

func deletePlan(userId, planId int64) (err error) {
	if userId <= 0 || planId <= 0 {
		err = errors.New(fmt.Sprintf("deletePlan params error! userId:%d; planId:%d; ", userId, planId))
		return
	}

	err = common.UpdateTable("`tbl_plans`", map[string]interface{}{"`end_time`": "NOW()"},
		[]*common.KeyValue{
			&common.KeyValue{"plan_id", planId},
			&common.KeyValue{"user_id", userId},
		})
	return
}
