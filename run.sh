#!/bin/sh
path=$(cd "$(dirname "$0")"; pwd)
echo $path
cd $path

sh stop.sh

screen -dmS eci
sleep 0.1

screen -S eci -X eval "screen" "stuff './server/bin/eci \n'"
