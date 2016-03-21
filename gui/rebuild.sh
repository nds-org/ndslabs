#!/bin/sh

# Exit on errors
# set -e

# Shut down old web server container
kubectl delete -f ../../../devtools/ndsdev/startup/ndslabs/gui.yaml;

# Sleep for 10s
sleep 10s

# Delete its image
docker rmi -f ndslabs/ndslabs-gui; 

# Build a new image from source
docker build -t ndslabs/ndslabs-gui -f Dockerfile.ndslabs-gui .

# Push the new image
docker push ndslabs/ndslabs-gui

# Restart the web server container
kubectl create -f ../../../devtools/ndsdev/startup/ndslabs/gui.yaml
