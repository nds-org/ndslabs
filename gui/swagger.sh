#!/bin/sh

#export DOWNLOADURL=https://raw.githubusercontent.com/nds-org/nds-labs/v2/apis/swagger-spec/ndslabs.json

DOWNLOADURL=$1
SWAGGERFILE=ndslabs
OUTPUTFILE=`pwd`/js/app/shared/api.js

# Install swagger-js-codegen
docker run --rm -it -v `pwd`/api:/data bodom0015/nodejs-bower-grunt npm install swagger-js-codegen

# Download newest swagger-spec.json
if [[ "$1" != "" ]]; then
	echo "Downloading swagger spec from ${DOWNLOADURL}"
	sudo curl -L ${DOWNLOADURL} > api/${SWAGGERFILE}
else
	echo "Rebuilding swagger spec from ../apis/swagger-spec/${SWAGGERFILE}"
#	sudo cp ../apis/swagger-spec/${SWAGGERFILE}.json api/${SWAGGERFILE}.json
fi

# Finally, generate AngularJS source
echo "Generating AngularJS source code..."
docker run --rm -it -v `pwd`/api:/data -w /data bodom0015/nodejs-bower-grunt node generate-angular.js > ${OUTPUTFILE} || cat ${OUTPUTFILE}

echo "Done!"
