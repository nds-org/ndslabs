# See https://coreos.com/docs/running-coreos/platforms/openstack/

nova boot \
--user-data ./coreos-config.yaml \
--image fd4d996e-9cf4-42bc-a834-741627b0e499 \
--key-name bb \
--flavor 3 \
--num-instances 3 \
--security-groups default coreos \
--nic net-id=165265ee-d257-43d7-b3b7-e579cd749ed4
