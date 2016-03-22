#!/bin/sh

# Exit on errors?
# set -e

JSSRCDIR=`pwd`/js

REPO=ndslabs
IMAGE=ndslabs-gui
TAG=latest


# If -c specified, clean old image
if [[ "${@/-c/}" != "$@" ]]; then 
	docker rmi -f $REPO/$IMAGE:$TAG
fi

/bin/sed -i -e "s#BUILD_DATE=\".*\"#BUILD_DATE=\"`date`\"#" "${JSSRCDIR}/Dockerfile.ndslabs-gui"

# Build a new image from source
docker build -t $REPO/$IMAGE:$TAG -f ${JSSRCDIR}/Dockerfile.$IMAGE ${JSSRCDIR}

# If -p specified, push to repo
if [[ "${@/-p/}" != "$@" ]]; then
	docker push $REPO/$IMAGE:$TAG
fi
