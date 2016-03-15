#!/bin/bash
#APISERVER=141.142.209.154
APISERVER=localhost
TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://$APISERVER:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

curl "${HEADERS[@]}" -X PUT --data @icat.json http://$APISERVER:8083/services/icat
curl "${HEADERS[@]}" -X PUT --data @cloudbrowser.json http://$APISERVER:8083/services/cloudbrowser
curl "${HEADERS[@]}" -X PUT --data @cloudbrowserui.json http://$APISERVER:8083/services/cloudbrowserui
