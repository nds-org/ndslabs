TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://localhost:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

HEADERS=("--header" "Authorization: Bearer ${TOKEN}" "--header" "Content-Type: application/json")

TEMPLATE_PATH="templates/clowder/json/"
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/clowder-svc.json http://localhost:8083/templates/clowder/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/mongo-svc.json http://localhost:8083/templates/mongo/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/rabbitmq-service.json http://localhost:8083/templates/rabbitmq/service
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/elasticsearch-service.json http://localhost:8083/templates/elasticsearch/service

curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/clowder-controller.json http://localhost:8083/templates/clowder/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/mongo-controller.json http://localhost:8083/templates/mongo/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/rabbitmq-controller.json http://localhost:8083/templates/rabbitmq/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/elasticsearch-controller.json http://localhost:8083/templates/elasticsearch/controller
curl "${HEADERS[@]}" -X PUT --data @$TEMPLATE_PATH/image-preview-controller.json http://localhost:8083/templates/image-preview/controller

