#!/bin/bash

# Install Xvfb + Chromium
apt-get -qq update && \
apt-get -qq install -t jessie-backports \
    chromium \
    xvfb

# Install protractor / webdriver-manager
npm install -g protractor@5.0.x
