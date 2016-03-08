#!/bin/bash

export DOWNLOADURL=https://raw.githubusercontent.com/nds-org/nds-labs/NDS-108/apis/swagger-spec/ndslabs.json
export SWAGGERFILE=swagger-spec.json
export OUTPUTFILE=../app/shared/NdsLabsRestApi.js

# Install swagger-js-codegen
docker run --rm -it -v `pwd`/data digitallyseamless/nodejs-bower-grunt npm install swagger-js-codegen

# Download newest swagger-spec.json
if [[ "${@/-u/}" != "$@" ]]; then
	echo "Downloading newest Swagger Spec..."
	sudo curl -L ${DOWNLOADURL} > ${SWAGGERFILE}
fi

# Finally, generate AngularJS source
echo "Generating AngularJS source code..."
docker run --rm -it -v `pwd`:/data digitallyseamless/nodejs-bower-grunt node generate-angular.js > ${OUTPUTFILE}

echo "Done!"
