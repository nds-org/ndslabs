#
# Build: docker build -t ndslabs/angular-ui .
#
FROM ndslabs/ng-base:latest

# Set build information here before building
ARG version="1.0.7"

# Set up environment variable defaults
ENV DEBIAN_FRONTEND="noninteractive" \
    TERM="xterm" \
    APISERVER_HOST="localhost" \
    APISERVER_PORT="443" \
    APISERVER_PATH="/api" \
    APISERVER_SECURE="true" \
    ANALYTICS_ACCOUNT="" \
    SUPPORT_EMAIL="ndslabs-support@nationaldataservice.org" \
    BASEDIR="/home"

# Copy in the manifests and the app source
WORKDIR $BASEDIR
COPY . $BASEDIR/

# Install build dependencies
RUN npm install 

# Build / minify our app
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "$BASEDIR/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "$BASEDIR/app/app.js" && \
    grunt ship

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
