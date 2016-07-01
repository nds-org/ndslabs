#!/bin/bash

cd /go/src/github.com/ndslabs/apiserver
go get github.com/tools/godep
godep restore
#go build -ldflags "-X main.Version=0.1alpha -X main.BuildDate=`date "+%Y-%m-%dT%H:%M:%S"`"
GOOS=linux GOARCH=amd64 godep go build -o build/bin/apiserver-linux-amd64
