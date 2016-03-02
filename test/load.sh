TOKEN=`curl -s -d "{\"username\": \"admin\", \"password\": \"12345\"}" -H "Content-Type:application/json" http://localhost:8083/authenticate | grep token | cut -f2 -d: | sed 's/^.*: \"//g' | sed 's/\"//g' | sed 's/ //g'`

echo $TOKEN
curl --header "Authorization: Bearer $TOKEN" --header "Content-Type:  application/json" -X POST --data @services/elastic.json http://localhost:8083/services
curl --header "Authorization: Bearer $TOKEN" --header "Content-Type:  application/json" -X POST --data @services/image-preview.json http://localhost:8083/services
curl --header "Authorization: Bearer $TOKEN" --header "Content-Type:  application/json" -X POST --data @services/rabbitmq.json http://localhost:8083/services

#templates/clowder/json/

#curl -u demo:12345 --header "Content-Type:  application/json" -X POST --data @clowder.json http://localhost:8083/services
#curl -u demo:12345 --header "Content-Type:  application/json" -X POST --data @mongo.json http://localhost:8083/services
#curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @project.json http://localhost:8083/projects/demo
#
#
#curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @clowder-svc.json http://localhost:8083/services/templates/clowder/service
#curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @mongo-svc.json http://localhost:8083/services/templates/mongo/service
#curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @clowder-controller.json http://localhost:8083/services/templates/clowder/controller
#curl --header "Authorization: Bearer $TOKEN" --header "Content-Type:  application/json" -X PUT --data @mongo-controller.json http://localhost:8083/services/templates/mongo/controller
#
#curl -u demo:12345 --header "Content-Type:  application/json" -X DELETE http://localhost:8083/services/clowder
#curl -u demo:12345 --header "Content-Type:  application/json" -X DELETE http://localhost:8083/services/mongo

#curl -u demo:12345 --header "Content-Type:  application/json" -X PUT --data @volume.json http://localhost:8083/projects/demo/volumes/541e9abb-9f11-4c49-88e3-82772883300a
