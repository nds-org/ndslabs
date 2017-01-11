#
# Build: docker build -t ndslabs/angular-ui .
#

# This image will be based on the official nodejs docker image
FROM debian:jessie

# Tell Docker we plan to use this port (http-server's default)
EXPOSE 3000

RUN apt-get -qq update && \
    apt-get -qq install \
      build-essential \
      curl \
      git \
      sudo \
      npm && \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get -qq install nodejs && \
    ln -s /usr/local/bin/node /usr/local/bin/nodejs && \
    apt-get -qq autoremove && \
    apt-get -qq autoclean && \
    apt-get -qq clean all && \
    rm -rf /var/cache/apk/* /tmp/*
    
# Set directory for npm/bower
ENV BASEDIR=/home
WORKDIR $BASEDIR

# Copy in the source
COPY package.json bower.json Gruntfile.js $BASEDIR/

# Install dependencies
RUN npm install -g bower grunt express && \
    npm install && \
    bower install --config.interactive=false --allow-root

# Copy in the source
COPY . $BASEDIR/
    
# Set build information here before building
ARG version="1.0.7"

# Set build number/date inside the container, as well as our default API server/port
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "$BASEDIR/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "$BASEDIR/app/app.js"

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
