#!/bin/bash
#APISERVER=141.142.209.154
APISERVER=localhost
TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://$APISERVER:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

curl "${HEADERS[@]}" -X PUT --data @elastic.json http://$APISERVER:8083/services/elasticsearch2
curl "${HEADERS[@]}" -X PUT --data @kibana.json http://$APISERVER:8083/services/kibana
curl "${HEADERS[@]}" -X PUT --data @logstash.json http://$APISERVER:8083/services/logstash
curl "${HEADERS[@]}" -X PUT --data @logspout.json http://$APISERVER:8083/services/logspout
