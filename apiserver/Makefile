BUILD_DATE := `date +%Y-%m-%d\ %H:%M`
VERSIONFILE := version.go

gensrc:
	rm -f $(VERSIONFILE)
	@echo "package main" > $(VERSIONFILE)
	@echo "const (" >> $(VERSIONFILE)
	@echo "  VERSION = \"0.1alpha\"" >> $(VERSIONFILE)
	@echo "  BUILD_DATE = \"$(BUILD_DATE)\"" >> $(VERSIONFILE)
	@echo ")" >> $(VERSIONFILE)
	mkdir -p build/bin build/pkg
	docker run --rm -it -v `pwd`:/go/src/github.com/nds-labs/apiserver -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/build.sh:/build.sh golang  /build.sh
