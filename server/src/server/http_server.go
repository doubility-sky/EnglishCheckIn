// web project login.go
package http_server

import (
	"common"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
	// "os"
	//"io/ioutil"
	"regexp"
)

var (
	rootPath string
	logger   *log.Logger
	route    = map[string]func(http.ResponseWriter, *http.Request){
		"/":         root,
		"/login":    login,
		"/register": register,
		"/query":    query,
		"/modify":   modifyPlans,
		"/checkin":  checkIn,
		"/userlist": userList,
	}
	// pages          = map[string]*template.Template{}
	COOKIE_MAX_AGE = int(time.Hour * 24 * 3 / time.Second) //3天
	userNumber     int64
)

func initPages() {
	// pages["index"], _ = template.ParseFiles(rootPath + "/index.html")
	// pages["content"], _ = template.ParseFiles(rootPath + "/content.html")
}

func initUserNumber() {
	results, err := common.QueryTable([]string{"count(1)"}, "`tbl_user`", nil, nil, "", nil)
	if err == nil && results.Next() {
		results.Scan(&userNumber)
		logger.Println(fmt.Sprintf("User Number is %d.", userNumber))
	}
}

func StartServer(addr, webPath string, l *log.Logger) {
	rootPath = webPath
	logger = l

	initPages()
	initUserNumber()

	serve := http.NewServeMux()
	for path, handler := range route {
		serve.HandleFunc(path, handler)
	}
	serve.Handle("/css/", http.StripPrefix("/", http.FileServer(http.Dir(rootPath))))
	serve.Handle("/fonts/", http.StripPrefix("/", http.FileServer(http.Dir(rootPath))))
	serve.Handle("/image/", http.StripPrefix("/", http.FileServer(http.Dir(rootPath))))
	serve.Handle("/scripts/", http.StripPrefix("/", http.FileServer(http.Dir(rootPath))))

	logger.Println("start http server", addr)
	logger.Println(http.ListenAndServe(addr, serve))
}

func root(w http.ResponseWriter, req *http.Request) {
	if req.URL.Path != "/" {
		http.NotFound(w, req)
		return
	}

	if !common.AutoLogin {
		sendIndexPage(w)
		return
	}

	autoLoginCookie, err := req.Cookie("auto_login")
	if err != nil || autoLoginCookie.Value != "true" {
		logger.Println("Cookie 'auto_login' is nil or not true! ip:" + getRemortIP(req))
		sendIndexPage(w)
		return
	}

	userIdCookie, err := req.Cookie("user_id")
	if err != nil {
		logger.Println("Cookie 'user_id' is nil! ip:" + getRemortIP(req))
		sendIndexPage(w)
		return
	}
	userId := userIdCookie.Value
	uid, _ := strconv.ParseInt(userId, 10, 64)
	if uid <= 0 {
		logger.Println(fmt.Sprintf("Cookie 'user_id' value is not valid number! user id:%s ip:%s",
			userId, getRemortIP(req)))
		sendIndexPage(w)
		return
	}

	name, err := loginUser(uid)
	if err != nil {
		logger.Println(fmt.Sprintf("Auto login failed! err:%s ip:%s", err.Error(), getRemortIP(req)))
		sendIndexPage(w)
		return
	}

	logger.Println(fmt.Sprintf("Auto login success! user id: %s name:%s ip:%s", userId, name, getRemortIP(req)))

	autoLoginCookie.MaxAge = COOKIE_MAX_AGE
	http.SetCookie(w, autoLoginCookie)
	userIdCookie.MaxAge = COOKIE_MAX_AGE
	http.SetCookie(w, userIdCookie)

	sendContentPage(w, uid, name)
}

func login(w http.ResponseWriter, req *http.Request) {
	// not debug
	if !common.Debug && req.Method != "POST" {
		logger.Println("Can't call /login, method is not post!")
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	values := parseHttpParamsToJson(req)
	logger.Println("login", values)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId, _ := values["user_id"].(string)
	logger.Println(values["user_id"])
	uid, _ := strconv.ParseInt(userId, 10, 64)
	if uid <= 0 {
		response["errorno"] = -1
		response["msg"] = fmt.Sprintf("Param user_id:%s is error!", userId)
		return
	}

	name, err := loginUser(uid)
	if err != nil {
		response["errorno"] = -2
		response["msg"] = "Login error. " + err.Error()
		return
	}

	autoLoginCookie := &http.Cookie{
		Name:     "auto_login",
		Value:    "true",
		Path:     "/",
		HttpOnly: false,
		MaxAge:   COOKIE_MAX_AGE,
	}
	http.SetCookie(w, autoLoginCookie)

	userIdCookie := &http.Cookie{
		Name:     "user_id",
		Value:    userId,
		Path:     "/",
		HttpOnly: false,
		MaxAge:   COOKIE_MAX_AGE,
	}
	http.SetCookie(w, userIdCookie)

	sendContentPage(w, uid, name)
	response = nil
}

func register(w http.ResponseWriter, req *http.Request) {
	// not debug
	if !common.Debug && req.Method != "POST" {
		logger.Println("Can't call /register, method is not post!")
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	// HACK: defend too many users, will be improved in future.
	if userNumber >= common.MaxUser {
		logger.Println(fmt.Sprintf("Can't register, too many users already! users:%d, limit:%d", userNumber, common.MaxUser))
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	values := parseHttpParamsToJson(req)
	logger.Println("register", values)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	name, _ := values["name"].(string)
	if len(name) == 0 {
		response["errorno"] = -1
		response["msg"] = "Param name is null!"
		return
	}

	re := regexp.MustCompile("[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007F]")
	if str := re.FindString(name); len(str) > 0 {
		response["errorno"] = -2
		response["msg"] = "Name can't contain special character: " + str
		return
	}

	uid, err := insertUser(name)
	if err != nil {
		response["errorno"] = -3
		response["msg"] = "Register error. Reduplicated names."
		return
	}

	userNumber = userNumber + 1

	autoLoginCookie := &http.Cookie{
		Name:     "auto_login",
		Value:    "true",
		Path:     "/",
		HttpOnly: false,
		MaxAge:   COOKIE_MAX_AGE,
	}
	http.SetCookie(w, autoLoginCookie)

	userIdCookie := &http.Cookie{
		Name:     "user_id",
		Value:    strconv.FormatInt(uid, 10),
		Path:     "/",
		HttpOnly: false,
		MaxAge:   COOKIE_MAX_AGE,
	}
	http.SetCookie(w, userIdCookie)

	sendContentPage(w, uid, name)
	response = nil
}

func query(w http.ResponseWriter, req *http.Request) {
	// not debug
	if !common.Debug && req.Method != "POST" {
		logger.Println("Can't call /query, method is not post!")
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	values := parseHttpParamsToJson(req)
	logger.Println("query", values)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId, _ := values["user_id"].(string)
	uid, _ := strconv.ParseInt(userId, 10, 64)

	name, _ := values["name"].(string)

	date, _ := values["date"].(string)
	beginTime, _ := strconv.ParseInt(date, 10, 64)

	response["user_id"] = userId
	response["name"] = name
	response["date"] = date

	// uid = 0 means only query all users' data.
	// query plans. TODO: client not support query all users' plans.
	plans, err := queryPlans(uid)
	if err != nil {
		response["errorno"] = -2
		response["msg"] = "Query plans error. " + err.Error()
		return
	}

	responsePlans := make(map[string]([]map[string]interface{}))
	if plans != nil {
		defer plans.Close()

		for plans.Next() {
			var planUserId, planId int64
			var planUserName, content, plan string
			if err := plans.Scan(&planUserId, &planUserName, &planId, &content, &plan); err != nil {
				logger.Println("Scan plans fail! user_id:" + userId)
				continue
			}

			userIdStr := strconv.FormatInt(planUserId, 10)
			planKey := userIdStr + "," + planUserName
			array, ok := responsePlans[planKey]
			if !ok {
				array = make([]map[string]interface{}, 0)
			}

			p := make(map[string]interface{})
			p["plan_id"] = strconv.FormatInt(planId, 10)
			p["content"] = content
			p["plan"] = plan
			array = append(array, p)

			responsePlans[planKey] = array
		}
	}
	response["plans"] = responsePlans

	// query records
	if beginTime <= 0 {
		response["errorno"] = 0
		return
	}
	endTime := time.Unix(beginTime, 0).AddDate(0, 1, 0).Unix() - 1

	records, err := queryRecords(uid, beginTime, endTime)
	if err != nil {
		response["errorno"] = -3
		response["msg"] = "Query records error. " + err.Error()
		return
	}

	responseRecords := make(map[string]([]map[string]interface{}))
	if records != nil {
		defer records.Close()

		for records.Next() {
			var recordUserId, planId, checkInTime, recordTime int64
			var recordUserName, content, plan string
			if err := records.Scan(&recordUserId, &recordUserName, &planId, &content, &plan, &checkInTime, &recordTime); err != nil {
				logger.Println(fmt.Sprintf("Scan records fail! id:%s err:%s", userId, err.Error()))
				continue
			}

			userIdStr := strconv.FormatInt(recordUserId, 10)
			recordKey := userIdStr + "," + recordUserName
			array, ok := responseRecords[recordKey]
			if !ok {
				array = make([]map[string]interface{}, 0)
			}

			r := make(map[string]interface{})
			r["plan_id"] = strconv.FormatInt(planId, 10)
			r["content"] = content
			r["plan"] = plan
			r["checkin_time"] = strconv.FormatInt(checkInTime, 10)
			r["record_time"] = strconv.FormatInt(recordTime, 10)
			array = append(array, r)

			responseRecords[recordKey] = array
		}
	}
	response["records"] = responseRecords

	// success
	response["errorno"] = 0
}

func modifyPlans(w http.ResponseWriter, req *http.Request) {
	// not debug
	if !common.Debug && req.Method != "POST" {
		logger.Println("Can't call /modifyPlans, method is not post!")
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	values := parseHttpParamsToJson(req)
	logger.Println("modifyPlans", values)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId, _ := values["user_id"].(string)
	uid, _ := strconv.ParseInt(userId, 10, 64)
	if uid <= 0 {
		response["errorno"] = -1
		response["msg"] = fmt.Sprintf("Param user_id:%s is error!", userId)
		return
	}

	plans, _ := values["data"].([]interface{})
	if plans == nil {
		response["errorno"] = -1
		response["msg"] = "No plan is changed!"
		return
	}

	for _, plan := range plans {
		p, _ := plan.(map[string]interface{})
		if p == nil {
			continue
		}

		planId, _ := p["plan_id"].(string)
		pid, _ := strconv.ParseInt(planId, 10, 64)
		if pid > 0 {
			if e := deletePlan(uid, pid); e != nil {
				logger.Println(e.Error())
			}
		} else {
			content, _ := p["content"].(string)
			plan, _ := p["plan"].(string)
			if content == "" || plan == "" {
				logger.Println("modifyPlans add error. content or plan is nil.", p)
				continue
			}

			if _, e := insertPlan(uid, content, plan); e != nil {
				logger.Println(e.Error())
			}
		}
	}

	response["errorno"] = 0
}

func checkIn(w http.ResponseWriter, req *http.Request) {
	// not debug
	if !common.Debug && req.Method != "POST" {
		logger.Println("Can't call /checkIn, method is not post!")
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	values := parseHttpParamsToJson(req)
	logger.Println("checkIn", values)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	userId, _ := values["user_id"].(string)
	uid, _ := strconv.ParseInt(userId, 10, 64)
	if uid <= 0 {
		response["errorno"] = -1
		response["msg"] = fmt.Sprintf("Param user_id:%s is error!", userId)
		return
	}

	records, _ := values["data"].(map[string]interface{})
	if records == nil {
		response["errorno"] = -1
		response["msg"] = "No checkIn!"
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

func userList(w http.ResponseWriter, req *http.Request) {
	// not debug
	if !common.Debug && req.Method != "POST" {
		logger.Println("Can't call /userList, method is not post!")
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	req.ParseForm()
	logger.Println("userList", req)

	var response = make(map[string]interface{})
	var msg string

	defer func() {
		msg = responseJsonToString(response)
		logger.Println(msg)
		io.WriteString(w, msg)
	}()

	results, err := queryUser(0)
	if err != nil {
		response["errorno"] = -1
		response["msg"] = "Query User List error. " + err.Error()
		return
	}

	data := make([]map[string]interface{}, 0)
	for results.Next() {
		var uid int64
		var name string
		if err := results.Scan(&uid, &name); err != nil {
			logger.Println(err.Error())
			continue
		}

		data = append(data, map[string]interface{}{
			"user_id": uid,
			"name":    name,
		})
	}
	response["data"] = data

	response["errorno"] = 0
}

func sendIndexPage(w http.ResponseWriter) {
	// var html = pages["index"]
	var html, _ = template.ParseFiles(rootPath + "/index.html")

	html.Execute(w, nil)
}

func sendContentPage(w http.ResponseWriter, userId int64, name string) {
	// var html = pages["content"]
	var html, _ = template.ParseFiles(rootPath + "/content.html")

	data := struct {
		Time   int64
		UserId int64
		Name   string
	}{
		Time:   time.Now().UTC().Unix(),
		UserId: userId,
		Name:   name,
	}
	// html.Execute(os.Stdout, data)
	html.Execute(w, data)
}

func parseHttpParamsToJson(req *http.Request) (values map[string]interface{}) {
	values = make(map[string]interface{})

	req.ParseForm()

	for k, v := range req.Form {
		values[k] = v[0]
	}

	if req.Method == "POST" && req.Header.Get("Content-Type") == "application/json" {
		tmp := make(map[string]interface{})
		json.NewDecoder(req.Body).Decode(&tmp)
		for k, v := range tmp {
			values[k] = v
		}
	}

	return
}

func responseJsonToString(response map[string]interface{}) string {
	if response == nil {
		return ""
	}

	if msg, err := json.Marshal(response); err != nil {
		logger.Println("responseJsonToString error: " + err.Error())
		return "{}"
	} else {
		return string(msg)
	}
}

func getRemortIP(req *http.Request) (ip string) {
	if ip = req.Header.Get("x-forwarded-for"); ip == "" {
		ip = req.RemoteAddr
	}
	return
}

func loginUser(userId int64) (name string, err error) {
	results, e := queryUser(userId)
	if results != nil {
		defer results.Close()
	}

	var uid int64
	if e != nil {
		err = errors.New(e.Error())
	} else if !results.Next() {
		err = errors.New(fmt.Sprintf("No user id: %d", userId))
	} else if e = results.Scan(&uid, &name); e != nil {
		err = errors.New(fmt.Sprintf("Get user name failed. user id: %d", userId))
	}

	return
}

func queryUser(userId int64) (results *sql.Rows, err error) {
	where := make([]*common.KeyValue, 0)
	if userId > 0 {
		where = append(where, &common.KeyValue{"`user_id`", userId})
	}
	results, err = common.QueryTable([]string{"`user_id`, `name`"}, "`tbl_user`", where, nil, "", []string{"`user_id`"})

	return
}

func queryPlans(userId int64) (results *sql.Rows, err error) {
	where := make([]*common.KeyValue, 0)
	if userId > 0 {
		where = append(where, &common.KeyValue{"a.`user_id`", userId})
	}
	where = append(where, &common.KeyValue{"NOW() between `begin_time` and `end_time`", nil})

	results, err = common.QueryTable([]string{"a.`user_id`", "b.`name`", "a.`plan_id`", "a.`content`", "a.`plan`"},
		"`tbl_plans` a LEFT JOIN `tbl_user` b ON a.`user_id` = b.`user_id`", where, nil, "",
		[]string{"a.`user_id`", "a.`plan_id`"})
	return
}

func queryRecords(userId, beginTime, endTime int64) (results *sql.Rows, err error) {
	where := make([]*common.KeyValue, 0)
	if userId > 0 {
		where = append(where, &common.KeyValue{"a.`user_id`", userId})
	}

	if beginTime > 0 && endTime > 0 {
		where = append(where, &common.KeyValue{
			fmt.Sprintf("(a.`end_time` >= FROM_UNIXTIME(%d) and a.`begin_time` <= FROM_UNIXTIME(%d))", beginTime, endTime),
			nil})
		where = append(where, &common.KeyValue{
			fmt.Sprintf("(c.`checkin_time` IS NULL OR c.`checkin_time` between FROM_UNIXTIME(%d) and FROM_UNIXTIME(%d))", beginTime, endTime),
			nil})
	}

	results, err = common.QueryTable(
		[]string{"a.`user_id`", "b.`name`", "a.`plan_id`", "a.`content`", "a.`plan`",
			"IFNULL(UNIX_TIMESTAMP(c.`checkin_time`), 0) as `checkin_time`",
			"IFNULL(UNIX_TIMESTAMP(c.`record_time`), 0) as `record_time`"},
		"`tbl_plans` a LEFT JOIN `tbl_user` b ON a.`user_id` = b.`user_id` LEFT JOIN `tbl_records` c ON a.`user_id` = c.`user_id` AND a.`plan_id` = c.`plan_id`",
		where, nil, "",
		[]string{"a.`user_id`", "a.`plan_id`", "c.`checkin_time`"})
	return
}

func insertUser(name string) (userId int64, err error) {
	if len(name) == 0 {
		err = errors.New(fmt.Sprintf("insertUser params error! name:%s;", name))
		return
	}

	userId, err = common.InsertTable("`tbl_user`", map[string]interface{}{"`name`": name}, nil)
	return
}

func insertPlan(userId int64, content, plan string) (planId int64, err error) {
	if userId <= 0 || len(content) == 0 || len(plan) == 0 {
		err = errors.New(fmt.Sprintf("insertPlan params error! userId:%d; content:%s; plan:%s;", userId, content, plan))
		return
	}

	planId, err = common.InsertTable("`tbl_plans`", map[string]interface{}{
		"`user_id`": userId,
		"`content`": content,
		"`plan`":    plan,
	}, nil)
	return
}

func insertRecord(userId, planId, checkInTime int64) (recordId int64, err error) {
	if userId <= 0 || planId <= 0 || checkInTime <= 0 {
		err = errors.New(fmt.Sprintf("insertRecord params error! userId:%d; planId:%d; checkInTime:%d;", userId, planId, checkInTime))
		return
	}

	recordId, err = common.InsertTable("`tbl_records`", map[string]interface{}{
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

	err = common.UpdateTable("`tbl_plans`", map[string]interface{}{"`end_time`=DATE_SUB(NOW(), INTERVAL 1 SECOND)": nil},
		[]*common.KeyValue{
			&common.KeyValue{"plan_id", planId},
			&common.KeyValue{"user_id", userId},
		})
	return
}
