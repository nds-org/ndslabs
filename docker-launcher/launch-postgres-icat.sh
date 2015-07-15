PGICAT_IMAGE=ndslabs/postgres-icat
PGICAT_NAME=db1
PGICAT_CID=$(docker run --name db1 -d $PGICAT_IMAGE)
