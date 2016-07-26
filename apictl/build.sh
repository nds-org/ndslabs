#!/bin/bash

BUILD_DATE=`date +%Y-%m-%d\ %H:%M`
VERSIONFILE="cmd/clientVersion.go"
VERSION="1.0.1-alpha"
APP="ndslabsctl"

if [ "$1" = "build" ] || [ -z $1 ]; then
	echo Building $APP
	if [ -e "$VERSIONFILE" ]; then
		rm -f $VERSIONFILE
	fi
	echo "package cmd" > $VERSIONFILE
	echo "const (" >> $VERSIONFILE
	echo "  VERSION = \"1.0-alpha\"" >> $VERSIONFILE
	echo "  BUILD_DATE = \"$BUILD_DATE\"" >> $VERSIONFILE
	echo ")" >> $VERSIONFILE
	docker run --rm -it -v `pwd`/../apiserver:/go/src/github.com/ndslabs/apiserver -v `pwd`:/go/src/github.com/ndslabs/apictl -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/gobuild.sh:/gobuild.sh golang:1.6 /gobuild.sh
	rm $VERSIONFILE
elif [ "$1" = "clean" ]; then
	echo Cleaning
	rm -rf build
fi



