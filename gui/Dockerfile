#
# Build: docker build -t ndslabs/angular-ui .
#

# This image will be based on the official nodejs docker image
FROM debian:jessie

# Serve AngularJS app on port 3000
EXPOSE 3000

# Set build information here before building
ARG version="1.0.7"

# Set up environment variable defaults
ENV DEBIAN_FRONTEND="noninteractive" \
    TERM="xterm" \
    BASEDIR="/home" \
    APISERVER_HOST="localhost" \
    APISERVER_PORT="" \
    APISERVER_PATH="/api" \
    APISERVER_SECURE="false" \
    ANALYTICS_ACCOUNT="" \
    SUPPORT_EMAIL="ndslabs-support@nationaldataservice.org"

# Install main dependencies
RUN echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list && \
    apt-get -qq update && \
    apt-get -qq install \
      build-essential \
      git \
      sudo \
      vim \
      curl \
      openjdk-8-jre-headless \
      openjdk-8-jdk \
      xvfb \
      chromium \
      npm && \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get -qq update && \
    apt-get -qq install nodejs && \
    ln -s /usr/local/bin/node /usr/local/bin/nodejs && \
    apt-get -qq autoremove && \
    apt-get -qq autoclean && \
    apt-get -qq clean all && \
    rm -rf /var/cache/apk/* /tmp/*

# Copy in the manifests and the app source
WORKDIR $BASEDIR
COPY . $BASEDIR/

# Install dependencies
RUN npm install -g bower grunt protractor@5.0.x && \
    npm install && \
    bower install --config.interactive=false --allow-root && \
    grunt ship

# Set build version/date for this image
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "$BASEDIR/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "$BASEDIR/app/app.js"

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
