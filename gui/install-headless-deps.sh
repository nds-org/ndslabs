#!/bin/bash

# Install karma and friends
npm install --only=dev

# Add Firefox debian repo and key
echo 'Installing E2E dependencies...'
echo 'deb http://mozilla.debian.net/ jessie-backports firefox-release' > /etc/apt/sources.list.d/debian-mozilla.list && \
curl mozilla.debian.net/pkg-mozilla-archive-keyring_1.1_all.deb -o ~/pkg-mozilla-archive-keyring_1.1_all.deb && \
dpkg -i ~/pkg-mozilla-archive-keyring_1.1_all.deb

# Install Xvfb + Chromium + Firefox
apt-get -y update && \
apt-get -qq install --no-install-recommends -t jessie-backports \
    openjdk-8-jre-headless \
    openjdk-8-jdk \
    xvfb \
    libgconf-2-4 \
    libexif12 \
    firefox \
    chromium \
    supervisor \
    netcat-traditional \
    curl \
    ffmpeg \
    gnupg

# Install protractor / webdriver-manager
npm install -g protractor@4.x
