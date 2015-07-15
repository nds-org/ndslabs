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
pushd iRODS-FUSE-Mod &> /dev/null
git checkout 814c8363a8f965fb65a3a400150ec257e8763b2f
chown -R user:root ../iRODS-FUSE-Mod

sudo -u user ./irodssetup < ../irods_setup
make fuse
cp ./clients/icommands/bin/* $DESTDIR
cp ./clients/fuse/bin/* $DESTDIR
popd &> /dev/null
rm -rf iRODS-FUSE-Mod
popd &> /dev/null
