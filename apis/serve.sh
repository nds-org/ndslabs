#!/bin/bash

# Use first arg as port number (8080 as default)
PORT=${1:-8080}
BUILD_DIR="./_build/html"

if [ -d "$BUILD_DIR" ]; then
	docker run -it --rm -v $(pwd)/${BUILD_DIR}:/usr/share/nginx/html -p ${PORT}:80 nginx
else
	echo 'No built HTML detected. Please run "./build.sh" first.'	
fi

