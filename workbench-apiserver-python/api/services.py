import logging

import pkg.config as config
from pkg.etcd import WBEtcd

import json
import connexion


# go version - GetAllServices
def search():
    etcdClient = WBEtcd(host=config.ETCD_HOST, port=config.ETCD_PORT)
    etcdBasePath = config.ETCD_BASE_PATH

    args = connexion.request.args
    catalog = args['catalog']
    services = []

    if catalog == 'system':
        services = etcdClient.getSystemServices()
    elif catalog == 'user':
        services = etcdClient.getUserServices()
    else:  # catalog == all or others
        services = etcdClient.getAllServices()

    return services
