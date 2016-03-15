#!/bin/bash
#APISERVER=141.142.209.154
APISERVER=localhost
TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://$APISERVER:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

curl "${HEADERS[@]}" -X PUT --data @clowder.json http://$APISERVER:8083/services/clowder
curl "${HEADERS[@]}" -X PUT --data @mongo.json http://$APISERVER:8083/services/mongo
curl "${HEADERS[@]}" -X PUT --data @elastic.json http://$APISERVER:8083/services/elasticsearch
curl "${HEADERS[@]}" -X PUT --data @rabbitmq.json http://$APISERVER:8083/services/rabbitmq

curl "${HEADERS[@]}" -X PUT --data @extractors/image-preview.json http://$APISERVER:8083/services/imagepreview
curl "${HEADERS[@]}" -X PUT --data @extractors/video-preview.json http://$APISERVER:8083/services/videopreview
curl "${HEADERS[@]}" -X PUT --data @extractors/plantcv.json http://$APISERVER:8083/services/plantcv

