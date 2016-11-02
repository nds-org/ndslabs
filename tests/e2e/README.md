# E2E Tests

See [Protractor](https://github.com/angular/protractor)

# Goals
* Test form validation
* Test routing
* Test against a live running instance
* Test live application in a real browser
* Test using mulstiple browsers

# Prerequisites
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/)
* [Google Chrome](https://www.google.com/chrome/browser/desktop/)

# Clone this repo
```bash
git clone https://github.com/nds-org/ndslabs
cd ndslabs/gui/
```

## Create an e2e.auth.js file
Create `e2e.auth.js` alongside `e2e.conf.js`.

Be sure to substitute in the values for the server and credentials you would like to test with:
```javascript
{
    "hostname": "",
    "username": "",
    "password": "",
}
```

WARNING: This file should **not** be checked into source control.

# Node.js in Docker
```bash
docker run -it -v `pwd`:/data -w /data bodom0015/nodejs-bower-grunt bash
```

## Install depedencies
Inside your new **nodejs-bower-grunt** container, run these commands to get all of the necessary dependencies:
```bash
npm install -g protractor
npm install
bower install
```

NOTE: This will automatically install the `protractor` and `webdriver-manager` executables onto your PATH.

## Run webdriver-manager
Run the following command to download necessary selenium binaries:
```bash
webdriver-manager update
```

Then run the following command to start a selenium webserver:
```bash
webdriver-manager start
```

Protractor will use this server to run your E2E test suite(s).

## Run Protractor CLI
Run the following command to run karma:
```bash
protractor e2e.conf.js
```

This will pop open a web browser (or multiple browsers) to run your tests.

The test browsers should close automatically once your test suite(s) have concluded.

Your console will print the results of running your e2e tests.

# TODO
* Expand test specs to encompass more use cases
* Figure out how to verify e-mail addresses programmatically, or use ngMockE2E
* Multiple browser support (firefox should be easy, but is not currently working)
* BrowserMob support for collecting HAR data?

