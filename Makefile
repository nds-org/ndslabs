BUILD_DATE := `date +%Y-%m-%d\ %H:%M`
VERSIONFILE := version.go
APP := apiserver

build:
	@echo Building
	rm -f $(VERSIONFILE)
	@echo "package main" > $(VERSIONFILE)
	@echo "const (" >> $(VERSIONFILE)
	@echo "  VERSION = \"1.0-alpha\"" >> $(VERSIONFILE)
	@echo "  BUILD_DATE = \"$(BUILD_DATE)\"" >> $(VERSIONFILE)
	@echo ")" >> $(VERSIONFILE)
	rm -f build/bin/$(APP)-linux-amd64 build/$(APP)-darwin-amd64
	mkdir -p build/bin build/bin build/pkg
	GOOS=darwin GOARCH=amd64 go build -o build/bin/$(APP)-darwin-amd64
	docker run --rm -it -v `pwd`:/go/src/github.com/ndslabs/apiserver -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/build.sh:/build.sh golang  /build.sh

#release:
#	docker build -t ndslabs/apiserver:latest .
#	docker push ndslabs/apiserver:latest
test:
	@echo Building test image
	docker build -t ndslabs/apiserver:test .
	@echo Pushing test image
	docker push ndslabs/apiserver:test

dev:
	@echo Building dev image
	docker build -t ndslabs/apiserver:dev .
	@echo Pushing dev image
	docker push ndslabs/apiserver:dev

clean: 
	rm -rf build
