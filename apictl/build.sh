#!/bin/bash

BUILD_DATE=`date +%Y-%m-%d\ %H:%M`
VERSIONFILE="cmd/clientVersion.go"
VERSION="1.0.2"
APP="ndslabsctl"


echo Building $APP
if [ -e "$VERSIONFILE" ]; then
    rm $VERSIONFILE
fi
echo "package cmd" > $VERSIONFILE
echo "const (" >> $VERSIONFILE
echo "  VERSION = \"$VERSION\"" >> $VERSIONFILE
echo "  BUILD_DATE = \"$BUILD_DATE\"" >> $VERSIONFILE
echo ")" >> $VERSIONFILE

glide install

echo Building darwin-amd64
GOOS=darwin GOARCH=amd64 go build -o build/bin/$APP-darwin-amd64
echo Building linux-amd64
GOOS=linux GOARCH=amd64 go build -o build/bin/$APP-linux-amd64


