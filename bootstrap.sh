#!/bin/bash

# Usage bootstrap.sh [nds-labs-src-basedir] [-v]
if [[ "$1" == "" || "$1" == "-v" ]]; then
	LABSDIR=`pwd`
else
	LABSDIR=$1
fi

DEBUGCMD=
CWD=`pwd`
if [[ "${@/-v/}" != "$@" ]]; then
	DEBUGCMD=echo 
fi

PREVDIR=`pwd`

# Ensure Kubernetes has started (locally, for now)
$DEBUGCMD sudo sh ./cluster/k8s/localdev/kube-up-local.sh

# Ensure that the API Server has started (apiserver)
$DEBUGCMD sudo systemctl start apiserver

# Ensure that the API Server is populated
CWD=$LABSDIR/apiserver/projects
cd ${CWD}
$DEBUGCMD sh ./load-projects.sh

for VARIABLE in clowder dataverse elk
do
	export "CWD=$LABSDIR/apiserver/specs/$VARIABLE"
	cd ${CWD}
	$DEBUGCMD sh ./load-specs.sh
done

# Ensure that the Web Server has started (nginx)
CWD=$LABSDIR/experiments/prototype-gui
cd ${CWD}
$DEBUGCMD sh ./start-server.sh

# Ensure that dependencies for the GUI are loaded (NPM / Bower packages)
CWD=${CWD}/src
cd ${CWD}
$DEBUGCMD sudo rm -rf bower_components/ node_modules/
$DEBUGCMD docker run --rm -it -v `pwd`:/data digitallyseamless/nodejs-bower-grunt npm install
$DEBUGCMD docker run --rm -it -v `pwd`:/data digitallyseamless/nodejs-bower-grunt bower install

cd $PREVDIR
