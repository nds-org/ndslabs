#!/bin/bash

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST:-www.local.ndslabs.org}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH:-/api}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECUREi:-true})#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('CookieOptions', .*#.constant('CookieOptions', { domain: '.${DOMAIN:-local.ndslabs.org}', secure: ${API_SECURE:-true}, path: '/' })#" "$BASEDIR/ConfigModule.js"

# Substitute the SIGNIN_URL passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('SigninUrl', .*)#.constant('SigninUrl', '${SIGNIN_URL:-https://www.local.ndslabs.org/login/}')#" "$BASEDIR/ConfigModule.js"

# Substitute the SUPPORT_EMAIL passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('SupportEmail', .*)#.constant('SupportEmail', '${SUPPORT_EMAIL:-ndslabs-support@nationaldataservice.org}')#" "$BASEDIR/ConfigModule.js"

# Substitute the ANALYTICS_ACCOUNT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('GaAccount', .*)#.constant('GaAccount', '${ANALYTICS_ACCOUNT}')#" "$BASEDIR/ConfigModule.js"

# Start ExpressJS
node server.js
