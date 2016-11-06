# E2E Tests

See [Protractor](https://github.com/angular/protractor)

# Goals
* Test form validation
* Test routing
* Test against a live running instance (API + UI)
* Test live application in a real browser
* Test using multiple browsers
* Test performance

# Prerequisites
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/)
* [Google Chrome](https://www.google.com/chrome/browser/desktop/)
* A running instance of Labs Workbench to test against
* Approved account credentials on the Labs Workbench test instance

# Clone this repo
```bash
git clone https://github.com/nds-org/ndslabs
cd ndslabs/gui/
```

## Create an e2e.auth.json file
Create `e2e.auth.json` alongside `e2e.conf.js`:
```javascript
{
  "hostname": "",
  "username": "",
  "password": "",
  "email": "",
  "name": "John Doe",
  "organization": "NDS",
  "description": "Automated E2E testing of Labs Workbench",
  "email-alternative": "",
  "username-alternative": "",
  "support-email": ""
}
```

### Server Info
* **hostname**: The Labs Workbench instance to run the tests against
* **support-email**: The SUPPORT_EMAIL asociated with this instance of the Labs Workbench API/UI

### Approved User Info
* **username**: The username of an approved account to use to log in for the tests
* **password**: The correct password of the above user's account
* **email**: The e-mail address associated with the above user's account

WARNING: The credentials supplied will be used for testing, during which applications will be created and deleted, started and stopped. You should register a special account to use for testing to avoid accidentally deleting relevant applications.

### Dummy User Info
* **name**: The "Full Name" to enter when testing the SignUp view
* **organization**: The "Organization" to enter when testing the SignUp view
* **description**: The "Description" to enter when testing the SignUp view
* **email-alternative**: The "E-mail Address" to enter when testing the SignUp view (must not be registered)
* **username-alternative**: The "Username" to enter when testing the SignUp view (must not be registered)

NOTE: The approved account's password will be reused during the dummy account's testing of the SignUp view.

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

### Suites
All suites are run by default.

To run only particular suites, you can pass in the `--suite` flag:
```bash
protractor e2e.conf.js --suite=dashboard,catalog,addSpec
```

# TODO
* Expand test specs to encompass more use cases
* Figure out how to verify e-mail addresses programmatically, or use ngMockE2E
* Multiple browser support (firefox should be easy, but is not currently working)
* BrowserMob support for collecting HAR data?

