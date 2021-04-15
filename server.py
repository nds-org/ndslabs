import logging

import connexion
from brapiresolver import BrapiResolver

if __name__ == '__main__':
    debug = True

    if debug:
        logging.basicConfig(
            format='%(asctime)-15s %(message)s', level=logging.DEBUG)
    else:
        logging.basicConfig(
            format='%(asctime)-15s %(message)s', level=logging.INFO)

    app = connexion.FlaskApp(__name__, debug=debug)

    app.add_api('swagger-ndslabs.yaml',
                arguments={'title': 'PYNDSLABS'},
                resolver=BrapiResolver('api'),
                resolver_error=501)

    app.run(port=5000, host=None, server='flask', debug=debug)
