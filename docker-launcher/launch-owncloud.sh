OC_NAME=oc1
OC_IMAGE=ndslabs/owncloud
OC_CPORT=80
OC_OPORT=9000
OC_RESOURCES=/var/owncloud
OC_CID=$(docker run --name ${OC_NAME} --link db2:db2 -v ${OC_RESOURCES}:/var/www/owncloud/data -d -p $OC_OPORT:$OC_CPORT $OC_IMAGE)
