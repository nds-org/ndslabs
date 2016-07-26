#!/bin/bash

cd /go/src/github.com/ndslabs/apictl
go get github.com/Masterminds/glide
glide install
GOOS=linux GOARCH=amd64 go build -o build/bin/ndslabsctl-linux-amd64
