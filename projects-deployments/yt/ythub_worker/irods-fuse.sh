#!/bin/bash

set -e

DESTDIR=/usr/local/bin/

if [ ! -d ${DESTDIR} ] ; then
   mkdir -p ${DESTDIR}
fi

pushd /tmp &> /dev/null
cat <<-EOF > irods_setup
no
no
no
no
no
yes
yes

EOF

git clone https://github.com/iychoi/iRODS-FUSE-Mod.git
chown -R user:root iRODS-FUSE-Mod
pushd iRODS-FUSE-Mod &> /dev/null

sudo -u user ./irodssetup < ../irods_setup
make fuse
cp ./clients/icommands/bin/* $DESTDIR
cp ./clients/fuse/bin/* $DESTDIR
popd &> /dev/null
rm -rf iRODS-FUSE-Mod
popd &> /dev/null
