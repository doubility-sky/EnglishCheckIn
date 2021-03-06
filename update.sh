#!/bin/sh

path=$(cd "$(dirname "$0")"; pwd)
echo $path

if [ "$1" != "" ]; then
    REMOTE=$1
else
    echo "Must have a remote addr"
    exit 0
fi

echo "REMOTE addr:"${REMOTE}

# rm files
ssh ${REMOTE} 'rm -rf /home/projects/eci/server/*'
ssh ${REMOTE} 'rm -rf /home/projects/eci/web/*'

# mkdir
ssh ${REMOTE} 'mkdir -p /home/projects/eci/mysqlbackup'
ssh ${REMOTE} 'mkdir -p /home/projects/eci/server'
ssh ${REMOTE} 'mkdir -p /home/projects/eci/server/logs'
ssh ${REMOTE} 'mkdir -p /home/projects/eci/web'


# cp files
shopt -s extglob

# web files
scp -r web/* ${REMOTE}:/home/projects/eci/web/
scp run.sh stop.sh mysqlbackup.sh ${REMOTE}:/home/projects/eci/

# server files. compile linux web server
mv server/bin/eci server/eci_bk

export GOPATH=${path}/server
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server/bin/eci eci

scp -r server/bin server/config ${REMOTE}:/home/projects/eci/server/

mv server/eci_bk server/bin/eci

shopt -u extglob
