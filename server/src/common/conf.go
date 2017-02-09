package common

import "github.com/Unknwon/goconfig"

const (
	defaultSection = "DEFAULT"

	mysqlSection         = "MYSQL"
	mysqlIPKey           = "ip"
	mysqlPortKey         = "port"
	mysqlDatabaseKey     = "database"
	mysqlUser            = "user"
	mysqlPassword        = "password"
	mysqlMaxOpenConnsKey = "max_open_connections"
	mysqlMaxIdleConnsKey = "max_idle_connections"

	httpSection = "HTTP"
	httpIPKey   = "ip"
	httpPortKey = "port"
)

var (
	// Default section

	// Mysql section
	MysqlIP           string
	MysqlPort         string
	MysqlDatabase     string
	MysqlUser         string
	MysqlPassword     string
	MysqlMaxOpenConns int
	MysqlMaxIdleConns int

	// HTTP section
	HttpIP   string
	HttpPort string
)

func LoadConfigFile(path string) error {
	path = path + "/conf.ini"
	conf, err := goconfig.LoadConfigFile(path)
	if err != nil {
		return err
	}

	MysqlIP = conf.MustValue(mysqlSection, mysqlIPKey, "127.0.0.1")
	MysqlPort = conf.MustValue(mysqlSection, mysqlPortKey, "3306")
	MysqlDatabase = conf.MustValue(mysqlSection, mysqlDatabaseKey, "en_check_in")
	MysqlUser = conf.MustValue(mysqlSection, mysqlUser, "en")
	MysqlPassword = conf.MustValue(mysqlSection, mysqlPassword, "123456")
	MysqlMaxOpenConns = conf.MustInt(mysqlSection, mysqlMaxOpenConnsKey, 10)
	MysqlMaxIdleConns = conf.MustInt(mysqlSection, mysqlMaxIdleConnsKey, 10)

	HttpIP = conf.MustValue(httpSection, httpIPKey, "")
	HttpPort = conf.MustValue(httpSection, httpPortKey, "8000")

	UtilInit()
	return err
}
