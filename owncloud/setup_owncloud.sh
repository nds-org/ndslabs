#!/bin/bash

cat >> /var/www/owncloud/config/autoconfig.php << EOF
<?php
\$AUTOCONFIG = array (
  'directory' => '/var/www/owncloud/data',
  'dbtype' => 'pgsql',
  'dbname' => 'owncloud',
  'dbhost' => 'db2',
  'dbtableprefix' => 'oc_',
  'dbuser' => 'ocadmin',
  'dbpass' => '${owncloudpassword}',
  'installed' => false,
);
EOF

cat >> /var/www/owncloud/config/nds.config.php << EOF
<?php
\$CONFIG = array (
  'overwritewebroot' => '/owncloud',
  'irodsresturl' => 'http://irodsrest/irods-rest/rest/server',
  'user_backends' => array(
    array(
      'class'=>'OC_User_Database',
      'arguments'=>array(),
    ),
    array(
      'class'=>'OC_User_HTTP',
      'arguments'=>array(),
    ),
  ),
);
EOF

/sbin/my_init
