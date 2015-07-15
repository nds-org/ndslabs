#!/bin/bash

cat <<EOF > /home/admin/dbresp
irods
irods
${irodszone}
1247
20000
20199
/var/lib/irods/Vault
${localzonesid}
${keyforagent}
rods
rods
yes
${dbhost}
5432
ICAT
irods
${irodspassword}

EOF

sudo su -c "/var/lib/irods/packaging/setup_irods.sh </home/admin/dbresp"
sudo usermod -G admin -a irods
## change irods user's irodsEnv file to point to localhost, since 
## it was configured with a transient Docker container's hostname
sed -i 's/^irodsHost.*/irodsHost icat1/' /var/lib/irods/.irods/.irodsEnv
sed -i 's/demoResc/defaultResc/' /var/lib/irods/.irods/.irodsEnv
sed -i 's/demoResc/defaultResc/' /etc/irods/core.re

echo "xmsgHost localhost" >> /etc/irods/server.config
echo "xmsgPort 1235" >> /etc/irods/server.config
touch /etc/irods/NDS.re
chown irods:irods /etc/irods/NDS.re
chmod 600 /etc/irods/NDS.re
sed -i 's/reRuleSet   core/reRuleSet   NDS,core' /etc/irods/server.config

sleep 2
sudo -u irods -i iadmin rmresc demoResc 
sudo -u irods -i iadmin mkresc defaultResc unixfilesystem \
    icat1:/var/lib/irods/Vault
sudo -u irods -i iadmin mkuser ytfido rodsuser
sudo -u irods -i iadmin moduser ytfido password ${ytfidopassword}
sudo -u irods -i imkdir /${irodszone}/home/rods/data
sudo -u irods -i imcoll -m filesystem /mnt/data /${irodszone}/home/rods/data
sudo -u irods -i ichmod -r read ytfido /${irodszone}/home/rods/data

/usr/bin/supervisord "-n"
