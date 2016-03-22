#!/bin/sh

#export DOWNLOADURL=https://raw.githubusercontent.com/nds-org/nds-labs/v2/apis/swagger-spec/ndslabs.json

DOWNLOADURL=$1
SWAGGERFILE=ndslabs.json
OUTPUTFILE=src/app/shared/api.js

# Install swagger-js-codegen
docker run --rm -it -v `pwd`/data bodom0015/nodejs-bower-grunt npm install swagger-js-codegen

# Download newest swagger-spec.json
if [[ "${@/-u/}" != "$@" ]]; then
	echo "Downloading newest Swagger Spec..."
	sudo curl -L ${DOWNLOADURL} > ${SWAGGERFILE}
else
	echo "Rebuilding swagger spec from ../apis/swagger-spec/ndslabs.json"
	sudo cp ../apis/swagger-spec/ndslabs.json api/ndslabs.json
fi

# Finally, generate AngularJS source
echo "Generating AngularJS source code..."
docker run --rm -it -v `pwd`/api:/data bodom0015/nodejs-bower-grunt node generate-angular.js > ${OUTPUTFILE} || cat ${OUTPUTFILE}

echo "Done!"
