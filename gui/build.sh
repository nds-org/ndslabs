#!/bin/sh

# Exit on errors?
# set -e

REPO=ndslabs
IMAGE=ndslabs-gui
TAG=develop


# If -c specified, clean old image
if [[ "${@/-c/ }" != "$@" ]]; then
	echo "Removing image: $REPO/$IMAGE:$TAG"
	docker rmi -f $REPO/$IMAGE:$TAG
fi

/bin/sed -i -e "s#BUILD_DATE=\".*\"#BUILD_DATE=\"`date`\"#" "Dockerfile.ndslabs-gui"

# Build a new image from source
docker build -t $REPO/$IMAGE:$TAG -f Dockerfile.$IMAGE .

# If -p specified, push to repo
if [[ "${@/-p/ }" != "$@" ]]; then
	echo "Pushing image: $REPO/$IMAGE:$TAG"
	docker push $REPO/$IMAGE:$TAG
fi
