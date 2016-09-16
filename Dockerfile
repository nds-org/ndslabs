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
COPY js/package.json js/bower.json js/Gruntfile.js /home/js/

# Install dependencies
RUN npm install -g bower grunt http-server && \
#    npm install && \
    bower install --config.interactive=false --allow-root
    
# Set directory for npm/bower
WORKDIR /home

# Copy in the source
COPY . /home/
    
# Set build information here before building
ARG version="1.0.5"

# Set build number/date inside the container, as well as our default API server/port
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "/home/js/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "/home/js/app/app.js"

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
