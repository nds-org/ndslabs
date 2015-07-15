#!/bin/bash

gosu postgres postgres --single <<- EOSQL
    CREATE USER ocadmin WITH PASSWORD '${owncloudpassword}';
    CREATE DATABASE owncloud TEMPLATE template0 ENCODING 'UNICODE';
    ALTER DATABASE owncloud OWNER TO ocadmin;
    GRANT ALL PRIVILEGES ON DATABASE owncloud TO ocadmin;
EOSQL
