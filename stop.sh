#!/bin/sh
path=$(cd "$(dirname "$0")"; pwd)
echo $path
cd $path

screen -S ec -X quit
sleep 0.1

echo "Server have stopped!"
