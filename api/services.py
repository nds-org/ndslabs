import logging

import pkg.config as config
from pkg.etcd import WBEtcd

#import json
import connexion


# go version - GetAllServices
def search():
    etcdClient = WBEtcd(port=config.ETCD_PORT)
    etcdBasePath = config.ETCD_BASE_PATH

    args = connexion.request.args
    logging.debug(args)
    catalog = args['catalog']

    if catalog == 'system':
        services = etcdClient.getGlobalServices(args)
    # elif args['catalog'] == 'user':
    #    key = '/ndslabs/services/'
    else:
        services = etcdClient.getGlobalServices(args)

    #result = etcdClient.read('/ndslabs/services/')
    #result = etcdClient.read(key)
    return services._children
