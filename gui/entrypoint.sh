#!/bin/bash

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e"
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST:-192.168.99.100}')#" "/home/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT:-30001}')#" "/home/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH:-/api}')#" "/home/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECURE:-false})#" "/home/js/app/app.js"

# Start our HTTP Server
http-server /home/js/
