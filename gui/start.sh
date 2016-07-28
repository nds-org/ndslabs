#!/bin/sh

# Stop anything running first
sh ./stop.sh


REPO=ndslabs
IMAGE=ndslabs-gui
TAG=develop

CLOUD9_PORT=8089
CLOUD9_USER=cloud9
CLOUD9_PASS=iHeartNdsLabs

WEBSERVER_PORT=30000
APISERVER_HOST=192.168.99.100
APISERVER_PORT=30001
APISERVER_PATH=/api

# If -d or --dev specified, mount directory for dynamically testing changes
OPTS=
if [[ "${@/-d/ }" != "$@" || "${@/--dev/ }" != "$@" ]]; then
	OPTS="-v `pwd`:/home/"
fi

# If -c specified, just open a console
DOCKERCOMMAND=
if [[ "${@/-c/ }" != "$@" ]]; then
	DOCKERCOMMAND="bash"
	echo "Running: $DOCKERCOMMAND inside of container"
fi

docker run --name ndslabs-gui -it -d -p ${WEBSERVER_PORT}:8080 -e APISERVER_HOST=${APISERVER_HOST} -e APISERVER_PORT=${APISERVER_PORT} -e APISERVER_PATH=${APISERVER_PATH} $OPTS $REPO/$IMAGE:$TAG $DOCKERCOMMAND

# If -d or --dev specified, run a Cloud 9 Docker container
if [[ "$OPTS" != "" ]]; then
	docker run --name cloud9 -it -d -p ${CLOUD9_PORT}:80 -v `pwd`:/workspace ndslabs/cloud9-nodejs && \
	echo "You should now be able to access Cloud 9 by navigating to http://{YOUR_FLOATING_IP}:${CLOUD9_PORT}."
fi
