#!/bin/bash

# Grab any drop-ins from envvars, if specified
if [ "${GIT_DROPIN_REPO}" != "" ]; then
    echo "Using drop-in: git clone --single-branch --depth=1 -b ${GIT_DROPIN_BRANCH:-master} ${GIT_DROPIN_REPO} /tmp/dropin"

    # Merge drop-in into existing $BASEDIR (exclude entrypoint.sh, so we don't mess up our current execution)
    git clone --single-branch --depth=1 -b ${GIT_DROPIN_BRANCH:-master} ${GIT_DROPIN_REPO} /tmp/dropin && \
    rm -f /tmp/dropin/gui/entrypoint.sh && \
    cp -r /tmp/dropin/gui/* "$BASEDIR/"
fi

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECURE})#" "$BASEDIR/ConfigModule.js"

# Substitute the SUPPORT_EMAIL passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('SupportEmail', .*)#.constant('SupportEmail', '${SUPPORT_EMAIL}')#" "$BASEDIR/ConfigModule.js"

# Substitute the ANALYTICS_ACCOUNT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('GaAccount', .*)#.constant('GaAccount', '${ANALYTICS_ACCOUNT}')#" "$BASEDIR/ConfigModule.js"

# Install dependencies and start ExpressJS
npm install && \
bower install --allow-root --config.interactive=false && \
grunt
