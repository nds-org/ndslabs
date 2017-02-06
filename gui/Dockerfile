#
# Build: docker build -t ndslabs/angular-ui .
#
FROM ndslabs/ng-base:latest

# Set build information here before building
ARG version="1.0.8"

# Set up necessary environment variables
ENV DEBIAN_FRONTEND="noninteractive" \
    TERM="xterm" \
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

# Set up some default environment variable
ENV APISERVER_HOST="localhost" \
    APISERVER_PORT="443" \
    APISERVER_PATH="/api" \
    APISERVER_SECURE="true" \
    ANALYTICS_ACCOUNT="" \
    SUPPORT_EMAIL="ndslabs-support@nationaldataservice.org"

# Expose port 3000 for ExpressJS
EXPOSE 3000

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
