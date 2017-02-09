package common

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

type KeyValue struct {
	Key   string
	Value interface{}
}

const (
	defaultMaxConn  = 10
	defaultOpenConn = 10
)

var db *sql.DB
var logger *log.Logger

func InitDB(ip, port, database, user, password string,
	openConns, idleConns int, l *log.Logger) {
	var err error
	logger = l

	mysqlConnParam := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8",
		user, password, ip, port, database)
	logger.Println(mysqlConnParam)

	// open
	db, err = sql.Open("mysql", mysqlConnParam)
	if err != nil {
		logger.Panicln(err.Error())
	}

	// test ping
	err = db.Ping()
	if err != nil {
		logger.Panic(err.Error())
	}

	// set param
	db.SetMaxOpenConns(openConns)
	db.SetMaxIdleConns(idleConns)
}

func Query(querySql string, args ...interface{}) (results *sql.Rows, err error) {
	stmt, err := prepare(querySql)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	return stmt.Query(args...)
}

func QueryRow(querySql string, args ...interface{}) (result *sql.Row, err error) {
	stmt, err := prepare(querySql)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	return stmt.QueryRow(args...), nil
}

func Exec(querySql string, args ...interface{}) (result sql.Result, err error) {
	stmt, err := prepare(querySql)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	return stmt.Exec(args...)
}

func Close() {
	if db != nil {
		db.Close()
	}
}

func prepare(querySql string) (stmt *sql.Stmt, err error) {
	if db == nil {
		return nil, errors.New("DB has not initialize! sql : " + querySql)
	}

	stmt, err = db.Prepare(querySql)
	if err != nil {
		return nil, errors.New("DB prepare error! " + err.Error())
	}

	return stmt, nil
}

// sql wrapper
func QueryTable(selects []string, from string, where []*KeyValue, group []string, having string, order []string) (err error, results *sql.Rows) {
	whereStatements := make([]string, 0)
	values := make([]interface{}, 0)

	if where != nil {
		for _, v := range where {
			if v.Value != nil {
				values = append(values, v.Value)
			}
			whereStatements = append(whereStatements, fmt.Sprintf("%s=?", v.Key))
		}
	}

	var whereStr string
	if len(whereStatements) > 0 {
		whereStr = fmt.Sprintf("WHERE %s", strings.Join(whereStatements, " and "))
	}
	var groupStr string
	if group != nil && len(group) > 0 {
		groupStr = fmt.Sprintf("GROUP BY %s", strings.Join(group, ","))
	}
	var havingStr string
	if len(having) > 0 {
		havingStr = fmt.Sprintf("HAVING %s", havingStr)
	}
	var orderStr string
	if order != nil && len(order) > 0 {
		orderStr = fmt.Sprintf("ORDER BY %s", strings.Join(order, ","))
	}

	querySql := fmt.Sprintf("SELECT %s FROM %s %s %s %s %s;",
		strings.Join(selects, ","), from, whereStr, groupStr, havingStr, orderStr)

	if results, err = Query(querySql, values); err != nil {
		sql := fmt.Sprintf(strings.Replace(querySql, "?", "%v", -1), values...)
		err = errors.New(fmt.Sprintf("Query table error: %s. sql: %s", err.Error(), sql))
	}

	return
}

func InsertTable(table string, params map[string]interface{}, update map[string]interface{}) (err error, id int64) {
	columns := make([]string, 0)
	placeholders := make([]string, 0)
	updateStatements := make([]string, 0)
	values := make([]interface{}, 0)

	if params != nil {
		for k, v := range params {
			values = append(values, v)
			placeholders = append(placeholders, "?")
			columns = append(columns, k)
		}
	}

	if update != nil {
		for k, v := range update {
			values = append(values, v)
			updateStatements = append(updateStatements, fmt.Sprintf("%s=?", k))
		}
	}

	var updateStr string
	if len(updateStatements) > 0 {
		updateStr = fmt.Sprintf("ON DUPLICATE KEY UPDATE %s", strings.Join(updateStatements, ","))
	}

	querySql := fmt.Sprintf("INSERT INTO %s(%s) VALUES(%s) %s;",
		table, strings.Join(columns, ","), strings.Join(placeholders, ","), updateStr)

	if result, e := Exec(querySql, values...); e != nil {
		sql := fmt.Sprintf(strings.Replace(querySql, "?", "%v", -1), values...)
		err = errors.New(fmt.Sprintf("Replace table error: %s. sql: %s", e.Error(), sql))
		return
	} else {
		id, _ = result.LastInsertId()
	}

	return
}

func UpdateTable(table string, update map[string]interface{}, where []*KeyValue) (err error) {
	if update == nil || len(update) == 0 {
		err = errors.New("Update table must have 'update' params!")
		return
	}

	updateStatements := make([]string, 0)
	whereStatements := make([]string, 0)
	values := make([]interface{}, 0)

	for k, v := range update {
		values = append(values, v)
		updateStatements = append(updateStatements, fmt.Sprintf("%s=?", k))
	}

	if where != nil {
		for _, v := range where {
			if v.Value != nil {
				values = append(values, v.Value)
			}
			whereStatements = append(whereStatements, fmt.Sprintf("%s=?", v.Key))
		}
	}

	var whereStr string
	if len(whereStatements) > 0 {
		whereStr = fmt.Sprintf("WHERE %s", strings.Join(whereStatements, " and "))
	}

	querySql := fmt.Sprintf("UPDATE %s SET %s %s;", table, strings.Join(updateStatements, ","), whereStr)

	if result, e := Exec(querySql, values...); e != nil {
		sql := fmt.Sprintf(strings.Replace(querySql, "?", "%v", -1), values...)
		err = errors.New(fmt.Sprintf("Update table error: %s. sql: %s", e.Error(), sql))
	} else if rows, _ := result.RowsAffected(); rows == 0 {
		sql := fmt.Sprintf(strings.Replace(querySql, "?", "%v", -1), values...)
		err = errors.New(fmt.Sprintf("Update table no row affected. sql: %s", sql))
	}

	return
}
