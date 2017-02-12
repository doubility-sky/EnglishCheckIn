#!/bin/sh

# jn is Loading privte shortcut
if [ "$1" != "" ]; then
    REMOTE=$1
else
    echo "Must have a remote addr"
    exit 0
fi

echo "REMOTE addr:"${REMOTE}

# rm files
ssh ${REMOTE} 'rm -rf /home/projects/ec/server/*'
ssh ${REMOTE} 'rm -rf /home/projects/ec/web/*'

# mkdir
ssh ${REMOTE} 'mkdir -p /home/projects/ec/mysqlbackup'
ssh ${REMOTE} 'mkdir -p /home/projects/ec/server'
ssh ${REMOTE} 'mkdir -p /home/projects/ec/server/logs'
ssh ${REMOTE} 'mkdir -p /home/projects/ec/web'


# cp files
shopt -s extglob

# web files
scp -r web/* ${REMOTE}:/home/projects/ec/web/
scp run.sh stop.sh mysqlbackup.sh ${REMOTE}:/home/projects/ec/

# server files. compile linux web server
mv server/bin/main server/main_bk
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server/bin/main server/src/main/main.go
scp -r server/bin server/config ${REMOTE}:/home/projects/ec/server/
mv server/main_bk server/bin/main

shopt -u extglob
