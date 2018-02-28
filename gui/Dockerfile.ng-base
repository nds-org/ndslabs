FROM ubuntu:xenial

# Install NodeJS and friends
RUN apt-get -qq update && \
    apt-get -qq install --no-install-recommends \
      build-essential \
      git \
      sudo \
      vim \
      npm \
      wget \
      curl && \
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash - && \
    apt-get -qq install nodejs && \
    apt-get -qq autoremove && \
    apt-get -qq autoclean && \
    apt-get -qq clean all && \
    rm -rf /var/cache/apk/* /tmp/* /var/lib/apt/lists/*

WORKDIR /root

# Install Grunt + Gulp
RUN npm install -g grunt-cli gulp-cli
