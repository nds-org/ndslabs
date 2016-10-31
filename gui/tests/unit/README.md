# Unit Tests

See [Karma](https://github.com/karma-runner/karma)

# Goals
* Test controller functions
* Test custom services (business logic)
* Test custom filters
* Test custom directives (not applicable at this time)
* Fast execution of tests
* Auto-watching files for quicker testing

# Prerequisites
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/)
* [Google Chrome](https://www.google.com/chrome/browser/desktop/)

# Clone this repo
```bash
git clone https://github.com/nds-org/ndslabs
cd ndslabs/gui/
```

# Node.js in Docker
```bash
docker run -it -v `pwd`:/data -w /data bodom0015/nodejs-bower-grunt bash
```

## Install depedencies
Inside your new **nodejs-bower-grunt** container, run these commands to get all of the necessary dependencies:
```bash
npm install -g karma-cli
npm install
bower install
```

NOTE: This will automatically install the `karma` executable onto your PATH.

## Run Karma CLI
Run the following command to run karma:
```bash
karma start karma.conf.js
```

This will pop open a web browser to run your tests - leave this browser open.

Your console will print the results of running your unit tests, and they will automatically re-run when you modify any of the files specified in karma.conf.js.

This allows for rapid test-driven development without needing to recompile or refresh or even unfocus your current window.

# TODO
* Expand test spec code coverage
* Multiple browser support? Is this possible?