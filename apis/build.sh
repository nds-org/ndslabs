#!/bin/bash

docker run --rm -it -v $(pwd):/usr/src -w /usr/src swaggerapi/swagger-codegen-cli generate -i swagger.yaml -l html2 -o _build/html
