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
* [Node.js](https://nodejs.org/en/)
* [Google Chrome](https://www.google.com/chrome/browser/desktop/)
* A running instance of Labs Workbench to test against
* Approved account credentials on the Labs Workbench test instance

# Clone this repo
```bash
git clone https://github.com/nds-org/ndslabs
cd ndslabs/gui/
```

## Create a protractor.auth.json file
Create `protractor.auth.json` alongside `protractor.conf.js`:
```javascript
{
  "hostname": "https://www.workbench.nationaldataservice.org/#",
  "support-email": "",
  
  "username": "username",
  "password": "password",
  "email": "email@email.com",
  
  "name": "John Doe",
  "organization": "NDS",
  "description": "Automated E2E testing of Labs Workbench",
  "email-alternative": "email2@email.com",
  "username-alternative": "username2"
}
```

### Server Info
* **hostname**: The Labs Workbench instance to run the tests against (NOTE: this must end with '/#')
* **support-email**: The SUPPORT_EMAIL associated with this instance of the Labs Workbench API/UI

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


## Install dependencies
Ensure that you have installed Google Chrome and that Node.js is accessible in your environment.

See [Node.js](https://nodejs.org/en/download/) for download links.

Then, run these commands to get all of the necessary dependencies:
```bash
npm install -g protractor
npm install
bower install
```

NOTE: This will automatically install the `protractor` and `webdriver-manager` executables onto your PATH.

### Via Docker
If you don't want to install Node.js on your host machine, you can try using Docker instead:
```bash
docker run -it --name=nodejs -v `pwd`:/data -w /data bodom0015/nodejs-bower-grunt bash
```

## Run webdriver-manager
Run the following command to download necessary selenium binaries:
```bash
webdriver-manager update
```

NOTE: you can pass update extra arguments like `--gecko`, `--ie`, `--ie32`, `--safari`, etc to download additional drivers.

Then run the following command to start a selenium webserver:
```bash
webdriver-manager start
```

Selenium Server will start, and should be kept running -- protractor will use it to run your E2E test suite(s).

## Run Protractor CLI
Open a new terminal and run the following command to run protractor:
```bash
protractor
```

This will pop open a web browser (or multiple browsers) to run your tests.

The test browsers should close automatically once your test suite(s) have concluded.

Your console will print the results of running your e2e tests.

### Suites
All suites are run by default.

To run only particular suites, you can pass in the `--suite` flag:
```bash
protractor --suite=dashboard,catalog,addSpec
```

# TODO
* Expand test specs to encompass more use cases
* Figure out how to verify e-mail addresses programmatically, or use ngMockE2E
* Multiple browser support (firefox should be easy, but is not currently working)
* BrowserMob support for collecting HAR data?

