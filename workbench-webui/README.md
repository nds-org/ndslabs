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
You can use Grunt to regenerate the AngularJS REST API client code from a Swagger API spec.

Usage:
```bash
grunt swagger-js-codegen
```

The spec from your local working copy of [swagger.yaml](swagger.yaml) will be used to produce `shared/ndslabs-api.js`, which contains the generated code comprising the NdsLabsApi module for AngularJS.
