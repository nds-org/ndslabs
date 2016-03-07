#!/bin/bash
TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://localhost:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

curl "${HEADERS[@]}" -X PUT --data @clowder.json http://localhost:8083/services/clowder
curl "${HEADERS[@]}" -X PUT --data @mongo.json http://localhost:8083/services/mongo
curl "${HEADERS[@]}" -X PUT --data @image-preview.json http://localhost:8083/services/image-preview
curl "${HEADERS[@]}" -X PUT --data @elastic.json http://localhost:8083/services/elasticsearch
#curl "${HEADERS[@]}" -X PUT --data @services/clowder/rabbitmq.json http://localhost:8083/services/rabbitmq

#curl "${HEADERS[@]}" -X PUT --data @services/dataverse/dataverse.json http://localhost:8083/services/dataverse
#curl "${HEADERS[@]}" -X PUT --data @services/dataverse/rserve.json http://localhost:8083/services/rserve
#curl "${HEADERS[@]}" -X PUT --data @services/dataverse/solr.json http://localhost:8083/services/solr
#curl "${HEADERS[@]}" -X PUT --data @services/dataverse/postgres.json http://localhost:8083/services/postgres
#curl "${HEADERS[@]}" -X PUT --data @services/dataverse/tworavens.json http://localhost:8083/services/tworavens
