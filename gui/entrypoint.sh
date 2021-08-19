#!/bin/bash

# Substitute the APISERVER_HOST and PORT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST:-www.local.ndslabs.org}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH:-/api}')#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECURE:-true})#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#^\.constant('CookieOptions', .*#.constant('CookieOptions', { domain: '.${DOMAIN:-local.ndslabs.org}', secure: ${APISERVER_SECURE:-true}, path: '/' })#" "$BASEDIR/ConfigModule.js"

# If provided, substitute UI customizations passed in by "docker run -e" or kubernetes
if [ "${WORKBENCH_NAME}" != "" ]; then
  /bin/sed -i -e "s#^\.constant('ProductName', .*)#.constant('ProductName', '${WORKBENCH_NAME}')#" "$BASEDIR/ConfigModule.js"
fi
if [ "${WORKBENCH_LANDING_HTML}" != "" ]; then
  /bin/sed -i -e "s#^\.constant('ProductLandingHtml', .*)#.constant('ProductLandingHtml', '${WORKBENCH_LANDING_HTML}')#" "$BASEDIR/ConfigModule.js"
fi
if [ "${WORKBENCH_BRAND_LOGO_PATH}" != "" ]; then
  /bin/sed -i -e "s#^\.constant('ProductBrandLogoPath', .*)#.constant('ProductBrandLogoPath', '${WORKBENCH_BRAND_LOGO_PATH}')#" "$BASEDIR/ConfigModule.js"
fi
if [ "${WORKBENCH_FAVICON_PATH}" != "" ]; then
  /bin/sed -i -e "s#^\.constant('ProductFaviconPath', .*)#.constant('ProductFaviconPath', '${WORKBENCH_FAVICON_PATH}')#" "$BASEDIR/ConfigModule.js"
fi
if [ "${WORKBENCH_LEARNMORE_URL}" != "" ]; then
  /bin/sed -i -e "s#^\.constant('ProductUrl', .*)#.constant('ProductUrl', '${WORKBENCH_LEARNMORE_URL}')#" "$BASEDIR/ConfigModule.js"
fi
if [ "${WORKBENCH_HELP_LINKS}" != "" ]; then
  /bin/sed -i -e "s#^\.constant('HelpLinks', [])#.constant('HelpLinks', ${WORKBENCH_HELP_LINKS})#" "$BASEDIR/ConfigModule.js"
fi

# Substitute the SIGNIN_URL passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('SigninUrl', .*)#.constant('SigninUrl', '${SIGNIN_URL:-https://www.local.ndslabs.org/login/}')#" "$BASEDIR/ConfigModule.js"

# Substitute the SUPPORT_EMAIL passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('SupportEmail', .*)#.constant('SupportEmail', '${SUPPORT_EMAIL:-ndslabs-support@nationaldataservice.org}')#" "$BASEDIR/ConfigModule.js"

# Substitute the ANALYTICS_ACCOUNT passed in by "docker run -e" or kubernetes
/bin/sed -i -e "s#^\.constant('GaAccount', .*)#.constant('GaAccount', '${ANALYTICS_ACCOUNT}')#" "$BASEDIR/ConfigModule.js"

# In lieu of actual user management, some instance-wide flags to toggle the more advanced features
/bin/sed -i -e "s#showConfig: .*,#showConfig: ${SHOW_CONFIG:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showLogs: .*,#showLogs: ${SHOW_LOGS:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showConsole: .*,#showConsole: ${SHOW_CONSOLE:-true},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showEditService: .*,#showEditService: ${SHOW_EDIT_SERVICE:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showRemoveService: .*,#showRemoveService: ${SHOW_REMOVE_SERVICE:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showServiceHelpIcon: .*,#showServiceHelpIcon: ${SHOW_SERVICE_HELP_ICON:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showCreateSpec: .*,#showCreateSpec: ${SHOW_CREATE_SPEC:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showImportSpec: .*,#showImportSpec: ${SHOW_IMPORT_SPEC:-false},#" "$BASEDIR/ConfigModule.js"
/bin/sed -i -e "s#showFileManager: .*,#showFileManager: ${SHOW_FILE_MANAGER:-false},#" "$BASEDIR/ConfigModule.js"

echo "{
  \"product\": {
    \"name\": \"${WORKBENCH_NAME:-Workbench}\",
    \"landingHtml\": \"${WORKBENCH_LANDING_HTML:-<p>Labs Workbench is an environment where developers can prototype tools and capabilities that help build out the NDS framework and services.</p>\n<p>In particular, it is a place that can host the development activities of <a href='http://www.nationaldataservice.org/projects/pilots.html'>NDS pilot projects.</a></p>\n}\",
    \"brandLogoPath\": \"${WORKBENCH_BRAND_LOGO_PATH:-../asset/png/favicon-32x32.png}\",
    \"faviconPath\": \"${WORKBENCH_FAVICON_PATH:-../asset/png/favicon-16x16.png}\",
    \"learnMoreUrl\": \"${WORKBENCH_LEARNMORE_URL:-http://www.nationaldataservice.org/platform/workbench.html}\",
    \"helpLinks\": ${WORKBENCH_HELP_LINKS:-[]},
  },
  \"advancedFeatures\": {
    \"showConfig\": ${SHOW_CONFIG:-false},
    \"showLogs\": ${SHOW_LOGS:-false},
    \"showConsole\": ${SHOW_CONSOLE:-true},
    \"showEditService\": ${SHOW_EDIT_SERVICE:-false},
    \"showRemoveService\": ${SHOW_REMOVE_SERVICE:-false},
    \"showServiceHelpIcon\": ${SHOW_SERVICE_HELP_ICON:-false},
    \"showCreateSpec\": ${SHOW_CREATE_SPEC:-false},
    \"showImportSpec\": ${SHOW_IMPORT_SPEC:-false},
    \"showFileManager\": ${SHOW_FILE_MANAGER:-false}
  }
}" > ./env.json

# Start ExpressJS
node server.js
