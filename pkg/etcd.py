import logging

import etcd
import pkg.config as config


class WBEtcd:
    def __init__(self, port=4001):
        self.client = etcd.Client(port=port)
        # wont let you run sensitive commands on non-leader machines, default is true
        #client = etcd.Client(host='127.0.0.1', port=4003, allow_redirect=False)
        # client = etcd.Client(
        #    host='127.0.0.1',
        #    port=4003,
        #    allow_reconnect=True,
        #    protocol='https',)

    def read(self, key):
        print(key)
        return self.client.read(key)

    def getGlobalServices(self, args):
        logging.debug("getGlobalService - catalog: "+args['catalog'])
        key = config.ETCD_BASE_PATH+"/services"
        services = self.client.read(key)

        return services
