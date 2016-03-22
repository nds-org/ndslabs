#!/bin/bash

# Run a Cloud 9 Docker container
docker run -it -d -p 1234:80 -v `pwd`:/workspace/ kdelfour/cloud9-docker

echo "You should now be able to access Cloud 9 by navigating to http://{YOUR_FLOATING_IP}:1234."
