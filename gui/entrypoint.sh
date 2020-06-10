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

# In lieu of actual user management, some instance-wide flags to toggle the more advanced features
/bin/sed -i -e "s#^\showConfig: .*,#showConfig: ${SHOW_CONFIG:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showLogs: .*,#showLogs: ${SHOW_LOGS:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showConsole: .*,#showConsole: ${SHOW_CONSOLE:-true},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showEditService: .*,#showEditService: ${SHOW_EDIT_SERVICE:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showRemoveService: .*,#showRemoveService: ${SHOW_REMOVE_SERVICE:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showServiceHelpIcon: .*,#showServiceHelpIcon: ${SHOW_SERVICE_HELP_ICON:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showCreateSpec: .*,#showCreateSpec: ${SHOW_CREATE_SPEC:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showImportSpec: .*,#showImportSpec: ${SHOW_IMPORT_SPEC:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\showFileManager: .*,#showFileManager: ${SHOW_FILE_MANAGER:-false},#" "$BASEDIR/ConfigModule.js"

# Start ExpressJS
node server.js
