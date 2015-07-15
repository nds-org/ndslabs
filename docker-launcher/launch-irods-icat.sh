ICAT_NAME=icat1
ICAT_IMAGE=ndslabs/irods-icat
ICAT_CPORT=1247
ICAT_RESOURCES=/mnt/data
ICAT_CID=$(docker run --name ${ICAT_NAME} --link db1:db1 -v ${ICAT_RESOURCES}:/mnt/data -d -p $ICAT_CPORT $ICAT_IMAGE)
