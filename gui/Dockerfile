#
# Build: docker build -t ndslabs/angular-ui .
#
FROM ndslabs/ng-base:latest

# Set build information here before building (or at build time with --build-args version=X.X.X)
ARG version="1.0.12"

# Set up necessary environment variables
ENV DEBIAN_FRONTEND="noninteractive" \
    TERM="xterm" \
    NODE_ENV="production" \
    BASEDIR="/home"

# Copy in the manifests and the app source
WORKDIR $BASEDIR
VOLUME $BASEDIR
COPY . $BASEDIR/

# Update build date / version number and enable backports
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "$BASEDIR/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "$BASEDIR/app/app.js" && \ 
    echo 'deb http://http.debian.net/debian jessie-backports main' >> /etc/apt/sources.list

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
