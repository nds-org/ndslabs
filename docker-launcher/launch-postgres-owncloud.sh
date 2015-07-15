PGOC_IMAGE=ndslabs/postgres-owncloud
PGOC_NAME=db2
PGOC_CID=$(docker run --name $PGOC_NAME -d $PGOC_IMAGE)
