# E2E Tests

See [Protractor](https://github.com/angular/protractor)

# Prerequisites
* Git
* Docker

# Goals
* Test form validation
* Test routing (?)
* Test user experience

# Clone this repo
```bash
git clone https://github.com/nds-org/ndslabs
cd ndslabs/gui/
```

# Node.js in Docker
```bash
docker run -it -v `pwd`:/data -w /data bodom0015/nodejs-bower-grunt bash
```

# Install depedencies
Inside your new **nodejs-bower-grunt** container, run these commands to get all of the necessary dependencies:
```bash
npm install -g bower karma-cli protractor grunt
npm install
bower install
```

# Run Karma CLI
Run the following command to run karma:
```bash
protractor protractor.conf.js
```

This will pop open a web browser (or multiple browsers) to run your tests.

The test browsers should close automatically once your test suite(s) have concluded.

Your console will print the results of running your e2e tests.

