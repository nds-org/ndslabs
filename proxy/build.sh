#!/bin/bash

rm -rf temp
git clone https://github.com/Xarthisius/configurable-http-proxy.git temp
pushd temp &> /dev/null
docker build -t ndslabs/proxy:latest .
popd &> /dev/null
