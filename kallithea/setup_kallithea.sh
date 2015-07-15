#!/bin/bash

if [ ! -e /home/kallithea/production.ini ]
then
  paster make-config Kallithea /home/kallithea/production.ini
  sed -i 's/app:main/app:kallithea/' /home/kallithea/production.ini
  cat << EOF >> /home/kallithea/production.ini
# prefix middleware for rc
[filter-app:main]
use = egg:PasteDeploy#prefix
prefix = /kallithea
next = kallithea
EOF
fi

if [ ! -d /home/kallithea/repos ]
then
  mkdir -p /home/kallithea/repos
fi

if [ ! -e /home/kallithea/kallithea.db ]
then
  paster setup-db /home/kallithea/production.ini \
              --name=kallithea \
              --user=kallithea \
              --password=${kpass} \
              --email=${kemail}  \
              --repos=/home/kallithea/repos \
              --force-yes
fi

paster serve production.ini host=0.0.0.0
