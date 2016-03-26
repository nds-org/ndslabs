#!/bin/bash

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e"
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "/home/app/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "/home/app/js/app/app.js"

# Start our HTTP Server
http-server /home/app/js
