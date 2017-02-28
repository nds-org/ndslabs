#!/bin/bash

set -e

if [ "$1" = 'apiserver' ]; then

	if [ -z "$ETCD_ADDR" ]; then 
		ETCD_ADDR="localhost:4001"
	fi

	if [ -z "$KUBERNETES_ADDR" ]; then 
		KUBERNETES_ADDR="https://localhost:6443"
	fi

	if [ -z "$CORS_ORIGIN_ADDR" ]; then 
		CORS_ORIGIN_ADDR="http://localhost"
	fi
	
	if [ -z "$PREFIX" ]; then 
		PREFIX="/api/"
	fi

	if [ -z "$TIMEOUT" ]; then 
		TIMEOUT="30"
	fi

	if [ -z "$INGRESS" ]; then 
		INGRESS="NodePort"
	fi

	if [ -z "$VOLUME_PATH" ]; then 
		VOLUME_PATH="/volumes"
	fi

	if [ -z "$VOLUME_NAME" ]; then 
		VOLUME_NAME="global"
	fi

	if [ -z "$SHARED_VOLUME_PATH" ]; then 
		SHARED_VOLUME_PATH="/shared"
	fi

	if [ -z "$SHARED_VOLUME_NAME" ]; then 
		SHARED_VOLUME_NAME="shared"
	fi

	if [ -z "$SMTP_HOST" ]; then 
		SMTP_HOST="smtp.ncsa.illinois.edu"
	fi

	if [ -z "$SMTP_PORT" ]; then 
		SMTP_PORT=25
	fi

	if [ -z "$SMTP_TLS" ]; then 
		SMTP_TLS=true
	fi

	if [ -z "$SUPPORT_EMAIL" ]; then 
		SUPPORT_EMAIL=support@ndslabs.org
	fi

	if [ -z "$ADMIN_PASSWORD" ]; then
		ADMIN_PASSWORD=`strings /dev/urandom | grep -o '[[:alnum:]]' | head -n 30 | tr -d '\n'`
	fi

	if [ -z "$REQUIRE_APPROVAL" ]; then 
		REQUIRE_APPROVAL="true"
	fi

	if [ -z "$MAX_MESSAGES" ]; then 
		MAX_MESSAGES=100
	fi


cat << EOF > /apiserver.json
{
    "port": "30001",
	"origin": "$CORS_ORIGIN_ADDR",
    "timeout": $TIMEOUT,
    "requireApproval": $REQUIRE_APPROVAL,
    "domain" : "$DOMAIN",
    "prefix" : "$PREFIX",
    "ingress": "$INGRESS",
    "supportEmail": "$SUPPORT_EMAIL",
    "username": "admin",
    "password": "admin",
    "homeVolume": "$VOLUME_NAME",
    "dataProviderURL": "$DATA_PROVIDER_URL",
    "defaultLimits": {
        "cpuMax": 2000,
        "cpuDefault": 1000,
        "memMax": 8196,
        "memDefault": 100,
        "storageDefault": 10
    },
    "etcd": {
        "address": "$ETCD_ADDR",
        "maxMessages": $MAX_MESSAGES
    },
    "kubernetes": {
        "address": "$KUBERNETES_ADDR",
        "username": "admin",
        "password": "admin"
    },
    "email": {
        "host": "$SMTP_HOST",
        "port": $SMTP_PORT,
        "tls": $SMTP_TLS
    },
    "specs": {
        "path": "/specs"
    },
    "volumes": [
	    {
            "name": "$VOLUME_NAME",
            "path": "$VOLUME_PATH",
            "type": "local"
        }, 
		{
			"name": "$SHARED_VOLUME_NAME",
            "path": "$SHARED_VOLUME_PATH",
            "type": "local"
        }
    ]
}
EOF

	if [ -z "$SPEC_GIT_REPO" ]; then 
		SPEC_GIT_REPO=https://github.com/nds-org/ndslabs-specs
	fi

	if [ -z "$SPEC_GIT_BRANCH" ]; then 
		SPEC_GIT_BRANCH=master
	fi

	git clone -b $SPEC_GIT_BRANCH $SPEC_GIT_REPO /specs

	echo $ADMIN_PASSWORD > /password.txt
	umask 0

	/apiserver -conf /apiserver.json -v 4 -passwd $ADMIN_PASSWORD

else
    exec "$@"
fi

