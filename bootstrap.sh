#!/bin/bash

# Usage bootstrap.sh [nds-labs-src-basedir] [-v]
if [[ "$1" == "" || "$1" == "-v" ]]; then
	export LABSDIR=`pwd`
else
	export LABSDIR=$1
fi

export "DEBUGCMD="
export "CWD=`pwd`"
if [[ "${@/-v/}" != "$@" ]]; then
	export "DEBUGCMD=eval echo ${CWD}:"
fi

export PREVDIR=`pwd`

# Ensure Kubernetes has started (locally, for now)
$DEBUGCMD sudo sh ./cluster/k8s/localdev/kube-up-local.sh

# Ensure that the API Server has started (apiserver)
$DEBUGCMD sudo systemctl start apiserver

# Ensure that the API Server is populated
export "CWD=~/apiserver/projects"
cd ${CWD}
$DEBUGCMD sh ./load-projects.sh

cd ~/apiserver/specs
for VARIABLE in clowder dataverse elk
do
	export "CWD=$LABSDIR/../apiserver/specs/$VARIABLE"
	cd ${CWD}
	$DEBUGCMD sh ./load-specs.sh
done

# Ensure that the Web Server has started (nginx)
export "CWD=$LABSDIR/experiments/prototype-gui"
cd ${CWD}
$DEBUGCMD sh ./start-server.sh

# Ensure that dependencies for the GUI are loaded (NPM / Bower packages)
export "CWD=${CWD}/src"
cd ${CWD}
$DEBUGCMD sudo rm -rf bower_components/ node_modules/
$DEBUGCMD docker run --rm -it -v `pwd`:/data digitallyseamless/nodejs-bower-grunt npm install
$DEBUGCMD docker run --rm -it -v `pwd`:/data digitallyseamless/nodejs-bower-grunt bower install

cd $PREVDIR
