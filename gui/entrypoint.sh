#!/bin/bash

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e"
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "/home/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "/home/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH}')#" "/home/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECURE})#" "/home/js/app/app.js"

# Move contents to the appropriate base path
# TODO: Is this necessary?
mkdir -p /home/$UI_BASE_PATH
mv js/* /home/$UI_BASE_PATH

# Start our HTTP Server
http-server /home/
