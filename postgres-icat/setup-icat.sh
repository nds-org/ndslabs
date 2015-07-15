#!/bin/bash

gosu postgres postgres --single <<- EOSQL
    CREATE DATABASE "ICAT" WITH TEMPLATE=template0;
    CREATE USER irods WITH PASSWORD '${irodspassword}';
    GRANT ALL PRIVILEGES ON DATABASE "ICAT" TO irods;
EOSQL
