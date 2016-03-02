TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://localhost:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

TEMPLATE_PATH="templates/clowder/json/"
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/clowder-svc.json http://localhost:8083/services/templates/clowder/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/mongo-svc.json http://localhost:8083/services/templates/mongo/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/rabbitmq-service.json http://localhost:8083/services/templates/rabbitmq/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/elasticsearch-service.json http://localhost:8083/services/templates/elasticsearch/service

curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/clowder-controller.json http://localhost:8083/services/templates/clowder/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/mongo-controller.json http://localhost:8083/services/templates/mongo/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/rabbitmq-controller.json http://localhost:8083/services/templates/rabbitmq/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/elasticsearch-controller.json http://localhost:8083/services/templates/elasticsearch/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/image-preview-controller.json http://localhost:8083/services/templates/image-preview/controller

