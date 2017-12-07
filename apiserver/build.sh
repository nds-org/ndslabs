#!/bin/bash

BUILD_DATE=`date +%Y-%m-%d\ %H:%M`
VERSIONFILE="pkg/version/version.go"
VERSION="1.0.13"


if [ "$1" == "local" ] || [ "$1" == "docker" ]; then

    if [ -e "$VERSIONFILE" ]; then 
        rm $VERSIONFILE
    fi
    mkdir -p pkg/version
    echo "package version" > $VERSIONFILE
    echo "const (" >> $VERSIONFILE
    echo "  VERSION = \"$VERSION \"" >> $VERSIONFILE
    echo "  BUILD_DATE = \"$BUILD_DATE\"" >> $VERSIONFILE
    echo ")" >> $VERSIONFILE
    
    glide install --strip-vendor

	if [ "$1" == "local" ]; then 
        UNAME=$(uname)
        if [ "$UNAME" == "Darwin" ]; then
	        OS="darwin"
        elif [ "$UNAME" == "Linux" ]; then
	        OS="linux"
        fi
        
        echo Building apiserver-$OS-amd64
        GOOS=$OS GOARCH=amd64 go build -o build/bin/apiserver-$OS-amd64 ./cmd/server
        
        echo Building apictl-$OS-amd64
        GOOS=$OS GOARCH=amd64 go build -o build/bin/ndslabsctl-$OS-amd64 ./cmd/apictl

	elif [ "$1" == "docker" ]; then 	

        echo Building apiserver-linux-amd64
        GOOS=linux GOARCH=amd64 go build -o build/bin/apiserver-linux-amd64 ./cmd/server
        
        echo Building ndslabsctl-linux-amd64
        GOOS=linux GOARCH=amd64 go build -o build/bin/ndslabsctl-linux-amd64 ./cmd/apictl

        echo Building ndslabsctl-darwin-amd64
        GOOS=darwin GOARCH=amd64 go build -o build/bin/ndslabsctl-darwin-amd64 ./cmd/apictl
    fi
    
elif [ "$1" == "clean" ]; then
	rm -r build
	rm -r vendor/github.com vendor/golang.org vendor/gopkg.in vendor/k8s.io
fi

