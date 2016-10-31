# Unit Tests

See [Karma](https://github.com/karma-runner/karma)

# Prerequisites
* Git
* Docker

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
karma start karma.conf.js
```

This will pop open a web browser to run your tests - leave this browser open.

Your console will print the results of running your tests, and they will automatically re-run when you modify any of the files specified in karma.conf.js.

This allows for rapid test-driven development without needing to recompile or refresh or even unfocus your current window.
