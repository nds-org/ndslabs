#!/bin/sh

# Always tag develop -> latest
docker tag ndslabs/ndslabs-gui:develop ndslabs/ndslabs-gui:latest
docker push ndslabs/ndslabs-gui:latest

# If given, tag with the given version number too
if [[ "$1" != "" ]]; then
	docker tag ndslabs/ndslabs-gui:develop ndslabs/ndslabs-gui:$1
	docker push ndslabs/ndslabs-gui:$1
fi
