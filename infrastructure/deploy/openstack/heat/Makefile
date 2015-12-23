IMAGES		:=	deploy-heat

BUILDARGS.deploy-heat := \
	CONFIG_CONTAINER_NAME=deploy-heat-cfg \
	CONFIG_PATH=/nds/conf.d/openstack

include ../../../devtools/Makefiles/Makefile.nds

shell:
	docker run --rm -it deploy-heat bash

test:
	docker run --rm -it deploy-heat bootstrap
