#!/bin/bash

cd /go/src/github.com/nds-labs/apictl
go get
GOOS=linux GOARCH=amd64 go build -o build/bin/amd64/apictl
