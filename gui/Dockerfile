#
# Build: docker build -t ndslabs/angular-ui .
#
FROM ndslabs/ng-base:focal-erbium

# Set build information here before building (or at build time with --build-args version=X.X.X)
ARG version="1.3.0"

# Set up necessary environment variables
ENV DEBIAN_FRONTEND="noninteractive" \
    TERM="xterm" \
    NODE_ENV="production" \
    BASEDIR="/home"


# Copy in our app source
WORKDIR $BASEDIR
COPY package.json package-lock.json $BASEDIR/
RUN npm install
COPY . $BASEDIR/

# Update build date / version number and enable backports
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "$BASEDIR/ConfigModule.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "$BASEDIR/ConfigModule.js"

# Install app dependencies
RUN grunt swagger-js-codegen

# Set up some default environment variable
ENV APISERVER_HOST="localhost" \
    APISERVER_PORT="443" \
    APISERVER_PATH="/api" \
    APISERVER_SECURE="true" \
    ANALYTICS_ACCOUNT="" \
    SHOW_CONSOLE="true" \
    SHOW_CONFIG="false" \
    SHOW_LOGS="false" \
    SHOW_IMPORT_SPEC="false" \
    SHOW_CREATE_SPEC="false" \
    SHOW_FILE_MANAGER="false" \
    SHOW_EDIT_SERVICE="false" \
    SHOW_SVC_HELP_ICON="false" \
    SUPPORT_EMAIL="ndslabs-support@nationaldataservice.org"

# Expose port 3000 for ExpressJS
EXPOSE 3000

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
