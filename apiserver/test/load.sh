curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @clowder.json http://localhost:8083/services
curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @mongo.json http://localhost:8083/services
curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @project.json http://localhost:8083/projects/demo

curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @clowder-svc.json http://localhost:8083/services/templates/clowder/service
curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @mongo-svc.json http://localhost:8083/services/templates/mongo/service
curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @clowder-controller.json http://localhost:8083/services/templates/clowder/controller
curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @mongo-controller.json http://localhost:8083/services/templates/mongo/controller

#curl -u demo:12345 --header "Content-Type:  application/json" -X DELETE http://localhost:8083/services/clowder
#curl -u demo:12345 --header "Content-Type:  application/json" -X DELETE http://localhost:8083/services/mongo
