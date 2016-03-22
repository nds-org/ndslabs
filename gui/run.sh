#!/bin/sh

REPO=ndslabs
IMAGE=ndslabs-gui
TAG=latest

CLOUD9_PORT=1234
WEBSERVER_PORT=30000
APISERVER_HOST=141.142.208.127
APISERVER_PORT=30001

JSSRCDIR=`pwd`/js

# If -d or --dev specified, mount directory for dynamically testing changes
OPTS=
if [[ "${@/-d/}" != "$@" || "${@/--dev/}" != "$@" ]]; then
	OPTS="-v ${JSSRCDIR}:/home/app"
fi

# If -c specified, just open a console
DOCKERCOMMAND=
if [[ "${@/-c/}" != "$@" ]]; then
	DOCKERCOMMAND="bash"
fi

echo "Running: $DOCKERCOMMAND inside of container"
docker run --name ndslabs-gui -it -d -p ${WEBSERVER_PORT}:8080 -e APISERVER_HOST=${APISERVER_HOST} -e APISERVER_PORT=${APISERVER_PORT} $OPTS $REPO/$IMAGE:$TAG $DOCKERCOMMAND

# If -d or --dev specified, run a Cloud 9 Docker container
if [[ "$OPTS" != "" ]]; then
	docker run --name cloud9 -it -d -p ${CLOUD9_PORT}:80 -v ${JSSRCDIR}:/workspace kdelfour/cloud9-docker

	echo "You should now be able to access Cloud 9 by navigating to http://{YOUR_FLOATING_IP}:1234."
fi
