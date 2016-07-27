#!/bin/bash

BUILD_DATE=`date +%Y-%m-%d\ %H:%M`
VERSIONFILE="version.go"
VERSION="1.0.1-alpha"
APP="apiserver"

if [ "$1" = "local" ] || [ "$1" = "docker" ]; then
	echo Building $APP
	if [ -e "$VERSIONFILE" ]; then 
		rm $VERSIONFILE
	fi
	echo "package main" > $VERSIONFILE
	echo "const (" >> $VERSIONFILE
	echo "  VERSION = \"$VERSION\"" >> $VERSIONFILE
	echo "  BUILD_DATE = \"$BUILD_DATE\"" >> $VERSIONFILE
	echo ")" >> $VERSIONFILE
	if f[ "$1" = "local" ]; then 
        glide install

        UNAME=$(uname)

        if [ "$UNAME" == "Darwin" ]; then
            echo Building darwin-amd64
            GOOS=darwin GOARCH=amd64 go build -o build/bin/$APP-darwin-amd64
        elif [ "$UNAME" == "Linux" ]; then
            echo Building linux-amd64
            GOOS=linux GOARCH=amd64 go build -o build/bin/$APP-linux-amd64
        fi
	fi
	if [ "$1" = "docker" ]; then 
		docker run --rm -it -v `pwd`:/go/src/github.com/ndslabs/apiserver -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/gobuild.sh:/gobuild.sh golang:1.6  /gobuild.sh
	fi

	rm $VERSIONFILE

elif [ "$1" = "dev" ]; then
	echo Building dev image
	docker build -t ndslabs/apiserver:dev .
	echo Pushing dev image
	docker push ndslabs/apiserver:dev
elif [ "$1" = "test" ]; then
	echo Building test image
	docker build -t ndslabs/apiserver:test .
	echo Pushing test image
	docker push ndslabs/apiserver:test
elif [ "$1" = "release" ]; then
	echo Building release image
	docker build -t ndslabs/apiserver:latest .
	docker build -t ndslabs/apiserver:$VERSION .
	echo Pushing release image
	docker push ndslabs/apiserver:latest
	docker push ndslabs/apiserver:$VERSION
elif [ "$1" = "clean" ]; then
	echo Cleaning
	rm -rf build
fi


