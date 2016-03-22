#!/bin/sh

REPO=ndslabs
IMAGE=ndslabs-gui
TAG=latest

# If -d or --dev specified, mount directory for dynamically testing changes
OPTS=
if [[ "${@/-d/}" != "$@" || "${@/--dev/}" != "$@" ]]; then
	OPTS="-v `pwd`/src:/home/app"
fi

# If -c specified, just open a console
DOCKERCOMMAND=
if [[ "${@/-c/}" != "$@" ]]; then
	DOCKERCOMMAND="bash"
fi


docker run -it --rm -p 30000:8080 -e APISERVER_HOST=141.142.208.127 -e APISERVER_PORT=30001 $OPTS $REPO/$IMAGE:$TAG $DOCKERCOMMAND
