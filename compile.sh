#!/bin/sh

path=$(cd "$(dirname "$0")"; pwd)
echo $path

export GOPATH=${path}/server

rm -f ${GOPATH}/bin/*

go install eci
