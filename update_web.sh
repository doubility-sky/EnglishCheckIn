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

shopt -u extglob
