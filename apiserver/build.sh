#!/bin/bash
set -e

BUILD_DATE=`date +%Y-%m-%d\ %H:%M`
VERSIONFILE="pkg/version/version.go"
VERSION="1.1.0"


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
    
    # Check for --cache flag
    args="$@"
    replaced="${@/--cache/}"
    if [ "$1" == "local" ] && [ "$args" == "$replaced" ]; then
        echo "Fetching dependencies..."
	if [ "$(whoami)" == "root" ]; then
		apt-get update -qq && apt-get install -qq curl
	else
		sudo apt-get update -qq && sudo apt-get install -qq curl
	fi
	which glide || curl https://glide.sh/get | sh
        glide install --strip-vendor
    fi
    
    COVERPKG=./cmd/server,./pkg/crypto,./pkg/etcd,./pkg/config,./pkg/email,./pkg/events,./pkg/kube,./pkg/middleware,./pkg/types,./pkg/validate
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

	if [ "$2" == "test" ]; then
           echo Building test apiserver-$OS-amd64

           GOOS=$OS GOARCH=amd64 go test -coverpkg=$COVERPKG -c -o build/bin/apiserver-$OS-amd64 ./cmd/server 
        fi

	elif [ "$1" == "docker" ]; then 	
        
 	  if [ "$2" == "test" ]; then
            echo Building test apiserver-linux-amd64
            GOOS=linux GOARCH=amd64 go test -coverpkg=$COVERPKG -c -o build/bin/apiserver-linux-amd64 ./cmd/server 
          else 
            echo Building apiserver-linux-amd64
            GOOS=linux GOARCH=amd64 go build -o build/bin/apiserver-linux-amd64 ./cmd/server
	  fi 

          echo Building ndslabsctl-linux-amd64
          GOOS=linux GOARCH=amd64 go build -o build/bin/ndslabsctl-linux-amd64 ./cmd/apictl

          echo Building ndslabsctl-darwin-amd64
          GOOS=darwin GOARCH=amd64 go build -o build/bin/ndslabsctl-darwin-amd64 ./cmd/apictl
    fi
    
elif [ "$1" == "clean" ]; then
	rm -r build
	rm -r vendor/github.com vendor/golang.org vendor/gopkg.in vendor/k8s.io
fi

