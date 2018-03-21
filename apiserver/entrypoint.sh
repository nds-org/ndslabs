#!/bin/bash

set -e

if [ "$1" = 'apiserver' ]; then

	if [ -z "$WORKBENCH_NAME" ]; then 
		WORKBENCH_NAME="Labs Workbench"
	fi

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

	if [ -z "$SHARED_VOLUME_READ_ONLY" ]; then 
		SHARED_VOLUME_READ_ONLY="false"
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
		SUPPORT_EMAIL="support@ndslabs.org"
	fi

	if [ -z "$SUPPORT_FORUM" ]; then 
		SUPPORT_FORUM="https://groups.google.com/forum/#!forum/ndslabs"
	fi

	if [ -z "$SUPPORT_CHAT" ]; then 
		SUPPORT_CHAT="https://gitter.im/nds-org/ndslabs"
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

	if [ -z "$INACTIVITY_TIMEOUT" ]; then 
		INACTIVITY_TIMEOUT=480
	fi

	if [ -z "$TOKEN_PATH" ]; then 
		TOKEN_PATH="/run/secrets/kubernetes.io/serviceaccount/token"
	fi

	if [ -z "$SIGNIN_URL" ]; then 
    		SIGNIN_URL="$CORS_ORIGIN_ADDR/login/#/",
	fi
        
	if [ -z "$AUTH_URL" ]; then 
    		AUTH_URL="$CORS_ORIGIN_ADDR/cauth/auth"
	fi

cat << EOF > /apiserver.json
{
    "port": "30001",
    "adminPort": "30002",
    "origin": "$CORS_ORIGIN_ADDR",
    "timeout": $TIMEOUT,
    "requireApproval": $REQUIRE_APPROVAL,
    "domain" : "$DOMAIN",
    "prefix" : "$PREFIX",
    "ingress": "$INGRESS",
    "username": "admin",
    "password": "admin",
    "homeVolume": "$VOLUME_NAME",
    "name": "$WORKBENCH_NAME",
    "dataProviderURL": "$DATA_PROVIDER_URL",
    "authSignInURL": "$SIGNIN_URL",
    "authURL": "$AUTH_URL",
    "support": {
        "email": "$SUPPORT_EMAIL",
        "forum": "$SUPPORT_FORUM",
        "chat": "$SUPPORT_CHAT"
	},
    "defaultLimits": {
        "cpuMax": 2000,
        "cpuDefault": 1000,
        "memMax": 8196,
        "memDefault": 100,
        "storageDefault": 10,
        "inactiveTimeout": $INACTIVITY_TIMEOUT
    },
    "etcd": {
        "address": "$ETCD_ADDR",
        "maxMessages": $MAX_MESSAGES
    },
    "kubernetes": {
        "address": "$KUBERNETES_ADDR",
        "username": "admin",
        "password": "admin",
    	"tokenPath": "$TOKEN_PATH"
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
            "type": "local",
            "readOnly": $SHARED_VOLUME_READ_ONLY
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
	echo "Cloned $SPEC_GIT_BRANCH $SPEC_GIT_REPO"

	echo $ADMIN_PASSWORD > /password.txt
	umask 0

	if [ -z "$TEST" ]; then
		apiserver -conf /apiserver.json --logtostderr=true -v=1 -passwd $ADMIN_PASSWORD 
        else
                echo "Running binary with test/coverage instrumentation"
                echo "Writing output to $VOLUME_PATH/coverage.out"
		apiserver -test.coverprofile=$VOLUME_PATH/coverage.out -test.v -test.run=TestRunMain 
	fi 
else
    exec "$@"
fi

