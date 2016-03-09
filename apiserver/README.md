##

This is very very drafty.

## Building

To build the apiserver binary:


To build the apiserver binary, this assumes you have standard go workspace with the following structure:

```
cd nds-labs
docker run --rm -it -v `pwd`:/go/src/github.com/nds-labs golang bash
# cd src/github.com/nds-labs/apiserver/
# go get
# go build
```

This will produce the apiserver binary.

### Configuration
The apiserver.conf is the primary configuration file

```
[Server]
Port=8083
Origin=http://<CORS origin host>
VolDir=/home/core/apiserver/volumes
JwtKey=/home/core/apiserver/jwt.key
Host=<your host ip>
VolumeSource=local

[Etcd]
Address=localhost:4001

[Kubernetes]
Address=localhost:8080

[OpenStack]
Username=
Password=
TenantId=
IdentityEndpoint=http://nebula.ncsa.illinois.edu:5000/v2.0/
VolumesEndpoint=http://nebula.ncsa.illinois.edu:8776/v2/
ComputeEndpoint=http://nebula.ncsa.illinois.edu:8774/v2/
```

If VolumeSource is "local", the OpenStack section isn't used.


### Running the server

The server requires etcd and Kubernetes. You can either run a separate etcd or use the Kubernetes instance.

To run
```
./apiserver -v <log verbosity 1-4>
```

To install a systemd service
```
cp apiserver.service /etc/systemd/system/apiserver.service
systemdctl start apiserver
```

### Test data

Loading a project:
```
cd test
./load-projects.sh
```

Loading service specs:
```
cd specs/clowder
./load-specs.sh
```
