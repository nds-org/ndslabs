#!/bin/bash

cd js/

# Install dependencies
npm install -g http-server bower grunt
npm install
bower install --config.interactive=false --allow-root

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e"
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "app/app.js"

# Start our HTTP Server
http-server /home/app/js
