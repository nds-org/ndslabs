#!/bin/bash

/bin/sed -i -e "s#^\.constant('ApiUri', '.*')#.constant('ApiUri', '${APISRV_URI}')#" "app/app.js"

http-server /home/app