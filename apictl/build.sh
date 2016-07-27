#!/bin/bash

BUILD_DATE=`date +%Y-%m-%d\ %H:%M`
VERSIONFILE="cmd/clientVersion.go"
VERSION="1.0.1-alpha"
APP="ndslabsctl"


if [ "$1" = "local" ] || [ "$1" = "docker" ]; then
    echo Building $APP
    if [ -e "$VERSIONFILE" ]; then
        rm $VERSIONFILE
    fi
    echo "package cmd" > $VERSIONFILE
    echo "const (" >> $VERSIONFILE
    echo "  VERSION = \"$VERSION\"" >> $VERSIONFILE
    echo "  BUILD_DATE = \"$BUILD_DATE\"" >> $VERSIONFILE
    echo ")" >> $VERSIONFILE
    if [ "$1" = "local" ]; then
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
		docker run --rm -it -v `pwd`/../apiserver:/go/src/github.com/ndslabs/apiserver -v `pwd`:/go/src/github.com/ndslabs/apictl -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/gobuild.sh:/gobuild.sh golang:1.6 /gobuild.sh
    fi

	rm $VERSIONFILE
elif [ "$1" = "clean" ]; then
	echo Cleaning
	rm -rf build
fi



