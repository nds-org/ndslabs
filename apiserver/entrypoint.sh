#!/bin/bash

set -e

if [ "$1" = 'apiserver' ]; then

	if [ -z "$ETCD_ADDR" ]; then 
		ETCD_ADDR="localhost:4001"
	fi

	if [ -z "$KUBERNETES_ADDR" ]; then 
		KUBERNETES_ADDR="localhost:8080"
	fi

cat << EOF > /apiserver.conf
[Server]
Port=8083
Origin=
VolDir=/volumes
Host=localhost
VolumeSource=local

[Etcd]
Address=$ETCD_ADDR

[Kubernetes]
Address=$KUBERNETES_ADDR

[OpenStack]
Username=
Password=
TenantId=
IdentityEndpoint=http://nebula.ncsa.illinois.edu:5000/v2.0/
VolumesEndpoint=http://nebula.ncsa.illinois.edu:8776/v2/
ComputeEndpoint=http://nebula.ncsa.illinois.edu:8774/v2/
EOF

	/apiserver -conf /apiserver.conf -v 4

elif [ "$1" = 'usage' ]; then
    echo  'docker run -d -p 8083:8083 -e "KUBERNETES_ADDR=localhost:8080" -e "ETCD_ADDR=localhost:4001" --name=apiserver  ndslabs/apiserver apiserver'

else
    exec "$@"
fi

