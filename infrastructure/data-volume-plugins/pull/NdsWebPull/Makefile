

build:
	docker build -t ndswebpull .

run:
	sudo ./app

containerrun:
	docker run --rm -it --privileged \
		-v /run/docker/plugins:/run/docker/plugins \
		-v /var/lib/docker/volumes/:/var/lib/docker/volumes \
		-v /data:/data \
		ndswebpull

