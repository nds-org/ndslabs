#!/bin/sh

# Exit on errors?
# set -e

REPO=ndslabs
IMAGE=ndslabs-gui
TAG=latest


# If -c specified, clean old image
if [[ "${@/-c/}" != "$@" ]]; then 
	docker rmi -f $REPO/$IMAGE:$TAG
fi

# Build a new image from source
docker build -t $REPO/$IMAGE:$TAG -f Dockerfile.$IMAGE .

# If -p specified, push to repo
if [[ "${@/-p/}" != "$@" ]]; then
	docker push $REPO/$IMAGE:$TAG
fi
