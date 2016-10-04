#!/bin/bash

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "/home/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "/home/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH}')#" "/home/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECURE})#" "/home/app/app.js"

# Substitute the SUPPORT_EMAIL passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('SupportEmail', .*)#.constant('SupportEmail', '${SUPPORT_EMAIL}')#" "/home/app/app.js"

# Start our HTTP Server
http-server /home/
