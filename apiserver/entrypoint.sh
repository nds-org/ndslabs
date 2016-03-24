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

cat << EOF > /apiserver.conf
[Server]
Port=8083
Origin=$CORS_ORIGIN_ADDR
VolDir=/volumes
Host=$HOST_ADDR
VolumeSource=local
SpecsDir=/specs

[Etcd]
Address=$ETCD_ADDR

[Kubernetes]
Address=$KUBERNETES_ADDR
Username=admin
Password=admin

[OpenStack]
Username=
Password=
TenantId=
IdentityEndpoint=http://nebula.ncsa.illinois.edu:5000/v2.0/
VolumesEndpoint=http://nebula.ncsa.illinois.edu:8776/v2/
ComputeEndpoint=http://nebula.ncsa.illinois.edu:8774/v2/
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
    echo  'docker run -d -p 8083:8083 -e "KUBERNETES_ADDR=https://localhost:6443" -e "ETCD_ADDR=localhost:4001" --name=apiserver  ndslabs/apiserver apiserver'

else
    exec "$@"
fi

