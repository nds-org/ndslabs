#!/bin/bash

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e"
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "/home/app/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "/home/app/js/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH}')#" "/home/app/js/app/app.js"

# Fix this awful hack
cp -r js/ ui/
mv ui/ js/

# Start our HTTP Server
http-server /home/app/js
