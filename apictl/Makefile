BUILD_DATE := `date +%Y-%m-%d\ %H:%M`
GIT_COMMIT := `git rev-parse \"HEAD^{commit}\"`
GIT_TAG := `git describe --tags --abbrev=14`
VERSIONFILE := cmd/clientVersion.go

gensrc:
	rm -f $(VERSIONFILE)
	@echo "package cmd" > $(VERSIONFILE)
	@echo "const (" >> $(VERSIONFILE)
	@echo "  VERSION = \"0.1alpha\"" >> $(VERSIONFILE)
	@echo "  BUILD_DATE = \"$(BUILD_DATE)\"" >> $(VERSIONFILE)
	@echo "  GIT_COMMIT = \"$(GIT_COMMIT)\"" >> $(VERSIONFILE)
	@echo "  GIT_TAG = \"$(GIT_TAG)\"" >> $(VERSIONFILE)
	@echo ")" >> $(VERSIONFILE)
	rm -f build/bin/amd64/apictl build/bin/darwin/apictl
	mkdir -p build/bin/amd64 build/bin/darwin build/pkg
	GOOS=linux GOARCH=amd64 go build -o build/bin/amd64/apictl
	GOOS=darwin GOARCH=amd64 go build -o build/bin/darwin/apictl
	docker run --rm -it -v `pwd`/../apiserver:/go/src/github.com/nds-labs/apiserver -v `pwd`:/go/src/github.com/nds-labs/apictl -v `pwd`/build/bin:/go/bin -v `pwd`/build/pkg:/go/pkg -v `pwd`/build.sh:/build.sh golang /build.sh
