# NDS Labs Web Interface

## Prerequisites
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/)


## Clone this Repository
Clone the source repo onto your local machine:
```bash
git clone https://github.com/nds-org/ndslabs
cd ndslabs/gui/
```


## Building the Image
The ndslabs/angular-ui image is built using the following command:
```bash
docker build -t ndslabs/angular-ui .
```


## Running the Image
The ndslabs/angular-ui image is not supported in raw Docker, as we usually run it via [Kubernetes specs](https://github.com/nds-org/ndslabs-deploy-tools/tree/master/FILES.deploy-tools/usr/local/lib/ndslabs/ansible/roles/ndslabs-api-gui/templates).

If you want to try to run it in Docker, it can be run using the following command:
```bash
# Set these variables to point to a running API server instance
APISERVER_HOST=
APISERVER_PORT=
APISERVER_PATH=
docker run --name ndslabs-webui -it -d \
           -p 80:8080 \
           -e APISERVER_HOST=${APISERVER_HOST} \
           -e APISERVER_PORT=${APISERVER_PORT} \
           -e APISERVER_PATH=${APISERVER_PATH} \
           ndslabs/angular-ui
```

NOTE: You may need to adjust the **CORS_ORIGIN_ADDR** of your API server in order to access it from this client, depending on your configuration.

### Customizing the UI
If you want to customize any part of the UI, feel free to fork this repo and set up the following parameters
```bash
# Setting these variables will clone the target repo over the top of the current UI source
GIT_DROPIN_REPO=https://github.com/nds-org/ndslabs
GIT_DROPIN_BRANCH=terra
```

An example of a typical set of UI customizations for http://www.terraref.ndslabs.org/#/ can be seen [here](https://github.com/nds-org/ndslabs/compare/terra).

## Running the Development Environment
For a cloud-based Node.js developer environment, you can run the following commands:
```bash
docker run --name cloud9 -it -d \
           -p 8080:80 \
           -v `pwd`:/workspace \
           ndslabs/cloud9-nodejs
```

WARNING: It is not advised to run this on a publicly exposed port, as the built-in basic auth is broken.


## Regenerate Swagger API
Regenerate the AngularJS REST API client code from a Swagger API spec

See [swagger.sh](swagger.sh)

Usage:
```bash
./swagger.sh [URL]
```

If no URL is given, the spec from your local working copy of [../apis/swagger-spec/ndslabs.yaml](../apis/swagger-spec/ndslabs.yaml) will be used instead.

Args:
* URL: An optional URL from which to download the swagger spec (must be in YAML format).

NOTE: If no URL is provided, the file located at ../apis/swagger-spec/ndslabs.json will be used instead.
