TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://localhost:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

TEMPLATE_PATH="templates/dataverse/json/"
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/dataverse-svc.json http://localhost:8083/services/templates/dataverse/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/postgres-svc.json http://localhost:8083/services/templates/postgres/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/solr-svc.json http://localhost:8083/services/templates/solr/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/rserve-svc.json http://localhost:8083/services/templates/rserve/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/tworavens-svc.json http://localhost:8083/services/templates/tworavens/service

curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/dataverse-rc.json http://localhost:8083/services/templates/dataverse/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/postgres-rc.json http://localhost:8083/services/templates/postgres/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/solr-rc.json http://localhost:8083/services/templates/solr/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/rserve-rc.json http://localhost:8083/services/templates/rserve/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/tworavens-rc.json http://localhost:8083/services/templates/tworavens/controller

