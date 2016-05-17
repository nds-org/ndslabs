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

cat << EOF > /apiserver.conf
[Server]
Port=30001
Origin=$CORS_ORIGIN_ADDR
VolDir=/volumes
VolumeSource=local
SpecsDir=/specs
Timeout=$TIMEOUT
Prefix=$PREFIX
Ingress=$INGRESS
Domain=$DOMAIN

[Etcd]
Address=$ETCD_ADDR

[Kubernetes]
Address=$KUBERNETES_ADDR
Username=admin
Password=admin
EOF

	if [ -z "$SPEC_GIT_REPO" ]; then 
		SPEC_GIT_REPO=https://github.com/nds-org/ndslabs-specs
	fi

	if [ -z "$SPEC_GIT_BRANCH" ]; then 
		SPEC_GIT_BRANCH=master
	fi

	git clone -b $SPEC_GIT_BRANCH $SPEC_GIT_REPO /specs

	/apiserver -conf /apiserver.conf -v 4


elif [ "$1" = 'usage' ]; then
    echo  'docker run -d -p 30001:30001 -e "KUBERNETES_ADDR=https://localhost:6443" -e "ETCD_ADDR=localhost:4001" --name=apiserver  ndslabs/apiserver apiserver'

else
    exec "$@"
fi

