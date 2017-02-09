// web project main.go
package main

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"common"
	"server"
)

var (
	runPath    string
	configPath string
	webPath    string
	logger     *log.Logger
	logFile    *os.File
)

func init() {
	runPath, _ = filepath.Abs(filepath.Dir(os.Args[0]))
	configPath, _ = filepath.Abs(runPath + "/../config")
	webPath, _ = filepath.Abs(runPath + "/../../web")
	logPath, _ := filepath.Abs(runPath + "/../logs")

	logFileName := logPath + "/" + time.Now().UTC().Format("20060102150405") + ".log"
	logFile, err := os.OpenFile(logFileName, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		panic("logFile open error")
	}
	writers := []io.Writer{
		logFile,
		os.Stdout,
	}
	fileAndStdoutWriter := io.MultiWriter(writers...)
	logger = log.New(fileAndStdoutWriter, "", log.Ldate|log.Ltime|log.Lshortfile)

	logger.Println("Running time path:", runPath)
	logger.Println("web path:", webPath)
}

func startDB() {
	common.InitDB(common.MysqlIP, common.MysqlPort, common.MysqlDatabase, common.MysqlUser, common.MysqlPassword, common.MysqlMaxOpenConns, common.MysqlMaxIdleConns, logger)
}

func startHttpServer() {
	http_server.StartServer(common.HttpIP+":"+common.HttpPort, webPath, logger)
}

func main() {
	err := common.LoadConfigFile(configPath)
	if err != nil {
		logger.Panicln(err.Error())
	}

	startDB()
	startHttpServer()

	defer logFile.Close()
}
