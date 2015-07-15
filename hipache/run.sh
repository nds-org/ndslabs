#!/bin/bash

echo <<-EOF > /hipache/config.json
    {
        "server": {
            "accessLog": "/tmp/access.log",
            "port": 80,
            "workers": 10,
            "maxSockets": 100,
            "deadBackendTTL": 30,
            "tcpTimeout": 30,
            "retryOnError": 3,
            "deadBackendOn500": true,
            "httpKeepAlive": false
        },
        "driver": ["etcd://${COREOS_CONTROLLER}:4001"]
    }
EOF

hipache -c /hipache/config.json
