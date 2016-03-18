#!/bin/bash

# Substitute the APISRV_URI passed in by "docker run -e"
/bin/sed -i -e "s#^\.constant('ApiUri', '.*')#.constant('ApiUri', '${APISRV_URI}')#" "app/app.js"

# Install dependencies
npm install -g http-server bower grunt && \
    npm install && \
    bower install --config.interactive=false --allow-root;

# Start our HTTP Server
http-server /home/app