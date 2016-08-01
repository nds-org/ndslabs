#
# Build: docker build -t ndslabs-gui .
#
# Single-node Usage: docker run -it -d -p 30000:8080 -e APISERVER_HOST=<ExternalIp> -e APISERVER_PORT=30000 ndslabs-gui
# Multi-node Usage: docker run -it -d -p 8080:8080 -e APISERVER_HOST=<ClusterIP> -e APISERVER_PATH="/api" ndslabs-gui
#

# This image will be based on the official nodejs docker image
FROM node:6.3.1

# Tell Docker we plan to use this port (http-server's default)
EXPOSE 8080
    
# Set directory for npm/bower
WORKDIR /home/js/

# Copy in the source
COPY js/package.json js/bower.json js/ js/Gruntfile.js /home/js/

# Install dependencies
RUN npm install -g bower grunt http-server && \
#    npm install && \
    bower install --config.interactive=false --allow-root
    
# Set directory for npm/bower
WORKDIR /home

# Copy in the source
COPY . /home/
    
# Set build information here before building
ENV BUILD_VERSION="1.0.1-alpha" \
    BUILD_DATE="Fri Jul 29 15:50:13 UTC 2016" \
    APISERVER_HOST="192.168.99.100" \
    APISERVER_PORT="30001" \
    APISERVER_PATH="" \
    APISERVER_SECURE="false"

# Set build numberi/date inside the container, as well as our default API server/port
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${BUILD_VERSION}')#" "/home/js/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('${BUILD_DATE}'))#" "/home/js/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('ApiHost', '.*')#.constant('ApiHost', '${APISERVER_HOST}')#" "/home/js/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('ApiPort', '.*')#.constant('ApiPort', '${APISERVER_PORT}')#" "/home/js/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('ApiPath', '.*')#.constant('ApiPath', '${APISERVER_PATH}')#" "/home/js/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('ApiSecure', .*)#.constant('ApiSecure', ${APISERVER_SECURE})#" "/home/js/app/app.js"

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
