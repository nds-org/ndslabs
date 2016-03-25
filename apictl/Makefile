BUILD_DATE := `date +%Y-%m-%d\ %H:%M`
GIT_COMMIT := `git rev-parse \"HEAD^{commit}\"`
GIT_TAG := `git describe --tags --abbrev=14`
VERSIONFILE := cmd/clientVersion.go
APP := ndslabsctl

gensrc:
	rm -f $(VERSIONFILE)
	@echo "package cmd" > $(VERSIONFILE)
	@echo "const (" >> $(VERSIONFILE)
	@echo "  VERSION = \"0.1alpha\"" >> $(VERSIONFILE)
	@echo "  BUILD_DATE = \"$(BUILD_DATE)\"" >> $(VERSIONFILE)
	@echo "  GIT_COMMIT = \"$(GIT_COMMIT)\"" >> $(VERSIONFILE)
	@echo "  GIT_TAG = \"$(GIT_TAG)\"" >> $(VERSIONFILE)
	@echo ")" >> $(VERSIONFILE)
	rm -f build/bin/$(APP)-linux-amd64 build/$(APP)-darwin-amd64
	mkdir -p build/bin build/bin build/pkg
	GOOS=darwin GOARCH=amd64 go build -o build/bin/$(APP)-darwin-amd64
	docker run --rm -it -v `pwd`/../apiserver:/go/src/github.com/ndslabs/apiserver -v `pwd`:/go/src/github.com/ndslabs/apictl -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/build.sh:/build.sh golang /build.sh
