KT_IMAGE=matthewturk/kallithea
KT_CPORT=5000
KT_CID=$(docker run -v /opt/kallithea:/home/kallithea -d -p $KT_CPORT $KT_IMAGE)
KT_PORT=$(docker port $KT_CID $KT_PORT | awk -F: '{ print $2 }')
