#
# Build: docker build -t ndslabs/angular-ui .
#

# This image will be based on the official nodejs docker image
FROM debian:testing

# Serve AngularJS app on port 3000
EXPOSE 3000

# Set build information here before building
ARG version="1.0.7"

# Required? for xvfb    
ENV DEBIAN_FRONTEND noninteractive

# Install main dependencies
RUN apt-get -qq update && \
    apt-get -qq install curl && \
    curl http://www.deb-multimedia.org/pool/main/d/deb-multimedia-keyring/deb-multimedia-keyring_2016.8.1_all.deb \
      -o /tmp/deb-multimedia-keyring_2015.6.1_all.deb && \
    dpkg -i /tmp/deb-multimedia-keyring_2015.6.1_all.deb && \
    rm /tmp/deb-multimedia-keyring_2015.6.1_all.deb && \
    echo "deb http://www.deb-multimedia.org stretch main non-free" >> /etc/apt/sources.list && \
    apt-get -qq update && \
    apt-get -qq install \
      build-essential \
      git \
      sudo \
      vim \
      openjdk-8-jre \
      xvfb \
      libgconf-2-4 \
      libexif12 \
      chromium \
      ffmpeg \
      netcat-traditional \
      gnupg \
      npm && \
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - && \
    apt-get -qq update && \
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
RUN npm install -g bower grunt protractor && \
    npm install && \
    bower install --config.interactive=false --allow-root

# Copy in the source
COPY . $BASEDIR/

# Set build version/date for this image
RUN /bin/sed -i -e "s#^\.constant('BuildVersion', '.*')#.constant('BuildVersion', '${version}')#" "$BASEDIR/app/app.js" && \
    /bin/sed -i -e "s#^\.constant('BuildDate', .*)#.constant('BuildDate', new Date('$(date)'))#" "$BASEDIR/app/app.js"

# The command to run our app when the container is run
CMD [ "./entrypoint.sh" ]
