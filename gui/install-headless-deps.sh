#!/bin/bash

# Install Xvfb + Chromium
apt-get -qq update && \
apt-get -qq install -t jessie-backports \
    openjdk-8-jre-headless \
    openjdk-8-jdk \
    chromium \
    xvfb

# Install protractor / webdriver-manager
npm install -g protractor@5.0.x
