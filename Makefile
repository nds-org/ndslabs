BUILD_DATE := `date +%Y-%m-%d\ %H:%M`
VERSIONFILE := version.go

gensrc:
	rm -f $(VERSIONFILE)
	@echo "package main" > $(VERSIONFILE)
	@echo "const (" >> $(VERSIONFILE)
	@echo "  VERSION = \"0.1alpha\"" >> $(VERSIONFILE)
	@echo "  BUILD_DATE = \"$(BUILD_DATE)\"" >> $(VERSIONFILE)
	@echo ")" >> $(VERSIONFILE)
	rm -f build/bin/amd64/apictl build/bin/darwin/apictl
	mkdir -p build/bin/amd64 build/bin/darwin build/pkg
	docker run --rm -it -v `pwd`:/go/src/github.com/nds-labs/apiserver -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/build.sh:/build.sh golang  /build.sh
	docker build -t ndslabs/apiserver:latest .
	docker push ndslabs/apiserver:latest
