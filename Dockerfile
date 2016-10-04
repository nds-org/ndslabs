#
# Build: docker build -t ndslabs-gui .
#
# Single-node Usage: docker run -it -d -p 30000:8080 -e APISERVER_HOST=<ExternalIp> -e APISERVER_PORT=30000 ndslabs-gui
# Multi-node Usage: docker run -it -d -p 8080:8080 -e APISERVER_HOST=<ClusterIP> -e APISERVER_PATH="/api" ndslabs-gui
#

# This image will be based on the official nodejs docker image
FROM debian:jessie

# Tell Docker we plan to use this port (http-server's default)
EXPOSE 8080

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
WORKDIR /home/

# Copy in the source
COPY package.json bower.json Gruntfile.js /home/

# Install dependencies
RUN npm install -g bower grunt http-server && \
    npm install && \
    bower install --config.interactive=false --allow-root

# Copy in the source
COPY . /home/
    
# Set build information here before building
ARG version="1.0.6"

# Set build number/date inside the container, as well as our default API server/port
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "/home/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "/home/app/app.js"

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
