#!/bin/bash

cd /go/src/github.com/ndslabs/apiserver
go get github.com/Masterminds/glide
glide install
GOOS=linux GOARCH=amd64 go build -o build/bin/apiserver-linux-amd64
