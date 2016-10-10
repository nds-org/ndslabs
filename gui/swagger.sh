#!/bin/sh

#export DOWNLOADURL=https://raw.githubusercontent.com/nds-org/nds-labs/v2/apis/swagger-spec/ndslabs.json

DOWNLOADURL=$1
SWAGGERFILE=ndslabs.yaml
OUTPUTFILE=`pwd`/app/shared/api.js

# Install swagger-js-codegen
docker run --rm -it -v `pwd`:/data bodom0015/nodejs-bower-grunt npm install swagger-js-codegen yamljs --save-dev

# Retrieve target swagger-spec.yaml
if [[ "$1" != "" ]]; then
	echo "Downloading swagger spec from ${DOWNLOADURL}"
	curl -L ${DOWNLOADURL} > app/api/${SWAGGERFILE}
else
	echo "Rebuilding swagger spec from ${SWAGGERFILE}"
fi

# Next, generate JSON spec (for Swagger UI)
echo "Generating JSON swagger spec"
docker run --rm -it -v `pwd`/node_modules:/data/node_modules -v `pwd`/app/api:/data -w /data bodom0015/nodejs-bower-grunt node jsonify.js > app/api/ndslabs.json || cat app/api/ndslabs.json

# Finally, generate AngularJS source
echo "Generating AngularJS source code..."
docker run --rm -it -v `pwd`/node_modules:/data/node_modules -v `pwd`/app/api:/data -w /data bodom0015/nodejs-bower-grunt node swagger.js > ${OUTPUTFILE} || cat ${OUTPUTFILE}

echo "Done!"
