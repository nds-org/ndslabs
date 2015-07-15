#!/bin/bash

UHOME=~user

if [ ! -d $UHOME/.irods ] ; then
   mkdir $UHOME/.irods
fi

if [ ! -f $UHOME/.irods/.irodsEnv ] ; then
   cat <<-EOF > $UHOME/.irods/.irodsEnv
      irodsHost ${ICAT_NAME}
      irodsPort ${ICAT_CPORT}
      irodsUserName ytfido
      irodsZone ${ICAT1_ENV_irodszone}
EOF
fi
chown user:docker -R $UHOME

if [ ! -f $UHOME/.irods/.irodsA ] ; then
   sudo -u user iinit ${ICAT1_ENV_ytfidopassword}
fi

exit 0
