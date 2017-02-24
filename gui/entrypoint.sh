#!/bin/bash

echo "Sedding"

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "$BASEDIR/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "$BASEDIR/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH}')#" "$BASEDIR/app/app.js"
/bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECURE})#" "$BASEDIR/app/app.js"

# Substitute the SUPPORT_EMAIL passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('SupportEmail', .*)#.constant('SupportEmail', '${SUPPORT_EMAIL}')#" "$BASEDIR/app/app.js"

# Substitute the ANALYTICS_ACCOUNT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('GaAccount', .*)#.constant('GaAccount', '${ANALYTICS_ACCOUNT}')#" "$BASEDIR/app/app.js"

echo "Installing dependencies"

# Install dependencies and start ExpressJS
cd $BASEDIR && \
npm install && \
bower install --allow-root --config.interactive=false

echo "Dropping in"

# Grab any drop-ins from envvars, if specified
if [ "${GIT_DROPIN_REPO}" != "" ]; then
    # Copy source over existing
    echo "cloning" && git clone --single-branch --depth=1 -b ${GIT_DROPIN_BRANCH:-master} "${GIT_DROPIN_REPO}" /tmp/dropin && echo "post-clone"
    echo "copying" && cp -r /tmp/dropin/gui/* $BASEDIR && echo "post-copy"
fi

echo "Grunting"

grunt
