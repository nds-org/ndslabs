#!/bin/bash

docker build -t ndslabs/sphinxdocs . && \
    docker run -it -v $(pwd):/usr/src ndslabs/sphinxdocs
