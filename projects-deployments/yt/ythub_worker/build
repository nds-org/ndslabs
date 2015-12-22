#!/bin/bash

rm -rf aux root
git init aux
pushd aux/ &> /dev/null
git remote add -f origin https://bitbucket.org/nds-org/yt_webapp.git
git config core.sparsecheckout true
echo "rest2/" >> .git/info/sparse-checkout
echo "supervisor/" >> .git/info/sparse-checkout
echo ".gitmodules" >> .git/info/sparse-checkout
git pull origin master
git submodule init
git submodule update
pushd rest2/backend/v1 &> /dev/null
git pull origin master
popd &> /dev/null
mv rest2 app
popd &> /dev/null

mkdir -p root/etc/supervisor.d
mkdir -p root/home/user/yt_serve
mkdir -p root/usr/local/bin

cp aux/supervisor/supervisord.conf root/etc/supervisord.conf
cp aux/supervisor/*.conf root/etc/supervisor.d/
cp -r aux/app/* root/home/user/yt_serve/
cp ./wrapdocker root/usr/local/bin/wrapdocker
cp ./setup_irods.py root/usr/local/bin/setup_irodsuser
chmod +x root/usr/local/bin/*

pushd root &> /dev/null
tar cvJf ../root.tar.xz .
popd &> /dev/null
docker build -t ndslabs/ythub_worker:latest .
