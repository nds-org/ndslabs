#!/bin/bash

BUILD_DATE=`date +%Y-%m-%d\ %H:%M`
VERSIONFILE="cmd/clientVersion.go"
VERSION="1.0-alpha"
APP="ndslabsctl"

if [ "$1" = "build" ] || [ -z $1 ]; then
	echo Building $APP
	rm -f $VERSIONFILE
	echo "package cmd" > $VERSIONFILE
	echo "const (" >> $VERSIONFILE
	echo "  VERSION = \"1.0-alpha\"" >> $VERSIONFILE
	echo "  BUILD_DATE = \"$BUILD_DATE\"" >> $VERSIONFILE
	echo ")" >> $VERSIONFILE
	rm -f build/bin/$APP-linux-amd64 build/$APP-darwin-amd64
	mkdir -p build/bin build/bin build/pkg
	echo Building Darwin
	GOOS=darwin GOARCH=amd64 go build -o build/bin/$APP-darwin-amd64
	echo Building Linux
	docker run --rm -it -v `pwd`/../apiserver:/go/src/github.com/ndslabs/apiserver -v `pwd`:/go/src/github.com/ndslabs/apictl -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/gobuild.sh:/gobuild.sh golang /gobuild.sh
elif [ "$1" = "clean" ]; then
	echo Cleaning
	rm -rf build
fi



