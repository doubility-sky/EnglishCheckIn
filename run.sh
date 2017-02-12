#!/bin/sh
path=$(cd "$(dirname "$0")"; pwd)
echo $path
cd $path

sh stop.sh

screen -dmS ec
sleep 0.1

screen -S ec -X eval "screen" "stuff './server/bin/main \n'"