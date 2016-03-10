#!/bin/bash
#APISERVER=141.142.209.154
APISERVER=localhost
TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://$APISERVER:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

curl "${HEADERS[@]}" -X PUT --data @dataverse.json http://$APISERVER:8083/services/dataverse
#curl "${HEADERS[@]}" -X PUT --data @rserve.json http://$APISERVER:8083/services/rserve
#curl "${HEADERS[@]}" -X PUT --data @solr.json http://$APISERVER:8083/services/solr
#curl "${HEADERS[@]}" -X PUT --data @postgres.json http://$APISERVER:8083/services/postgres
#curl "${HEADERS[@]}" -X PUT --data @tworavens.json http://$APISERVER:8083/services/tworavens
