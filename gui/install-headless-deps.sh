#!/bin/bash

# Enable backports for Debian (Jessie)
echo "deb http://http.debian.net/debian jessie-backports main" >> /etc/apt/sources.list

# Install Java 8 + Xvfb + Chromium
apt-get -qq update && \
apt-get -qq install \
    openjdk-8-jre-headless \
    openjdk-8-jdk \
    chromium \
    xvfb

# Install protractor / webdriver-manager
npm install -g protractor@5.0.x
