#!/bin/sh
#
# Usage: ./release.sh [tagName] [-t]
#
# tagName: The desired version to assign to the current dev image before pushing
# -t: Forego updating "latest" stable image (only tag a test image)
#

REPO="ndslabs"
IMAGE="ndslabs-gui"
DEV="develop"
STABLE="latest"
TAG="$1"

# If given, tag with the given version number too
if [[ "$TAG" != "" && "$TAG" != "-t" && "$TAG" != "$STABLE" ]]; then
	echo "Tagging image: $REPO/$IMAGE:$DEV -> $REPO/$IMAGE:$TAG"
	docker tag $REPO/$IMAGE:$DEV $REPO/$IMAGE:$TAG && \
	docker push $REPO/$IMAGE:$TAG
fi

# Update "latest" unless -t is specified
if [[ "${@/-t/ }" == "$@" ]]; then
	echo "Tagging image: $REPO/$IMAGE:$DEV -> $REPO/$IMAGE:$STABLE"
	docker tag $REPO/$IMAGE:$DEV $REPO/$IMAGE:$STABLE && \
	docker push $REPO/$IMAGE:$STABLE
fi