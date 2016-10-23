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

	if [ -z "$SMTP_HOST" ]; then 
		SMTP_HOST="smtp.ncsa.illinois.edu"
	fi

	if [ -z "$SMTP_PORT" ]; then 
		SMTP_PORT=25
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

cat << EOF > /apiserver.conf
[Server]
Port=30001
Origin=$CORS_ORIGIN_ADDR
VolDir=$VOLUME_PATH
VolName=$VOLUME_NAME
SpecsDir=/specs
Timeout=$TIMEOUT
Prefix=$PREFIX
Ingress=$INGRESS
Domain=$DOMAIN
RequireApproval=$REQUIRE_APPROVAL

[DefaultLimits]
CpuMax=4000
CpuDefault=1000
MemMax=12288
MemDefault=100
StorageDefault=20

[Etcd]
Address=$ETCD_ADDR

[Kubernetes]
Address=$KUBERNETES_ADDR
Username=admin
Password=admin

[Email]
Host=$SMTP_HOST
Port=$SMTP_PORT
SupportEmail=$SUPPORT_EMAIL

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

	/apiserver -conf /apiserver.conf -v 4 -passwd $ADMIN_PASSWORD

else
    exec "$@"
fi

