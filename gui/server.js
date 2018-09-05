// Import utilities
const path = require('path');
const http = require('http');
const request = require('request');

// Import winston for logging
const winston = require('winston');

// Import express and middleware modules
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Cookies options must be EXACTLY the same to properly clear a cookie
const secureCookie = process.env.API_SECURE || true;
const cookieDomain = '.' + (process.env.DOMAIN || 'local.ndslabs.org');
const cookieOpts = { domain: cookieDomain, path: '/', secure: secureCookie };

// Declare a new express app
const app = express();

const basedir = process.env.BASEDIR;
const port = 3000;

// Build up a Workbench API URL
const apiProtocol = 'http:'; // HTTP, since this isn't going through the loadbalancer
const apiHost = process.env.NDSLABS_APISERVER_SERVICE_HOST || 'localhost';
const apiPort = process.env.NDSLABS_APISERVER_SERVICE_PORT || '30001';
const apiPath = '/api';
let apiBase = apiProtocol + '//' + apiHost;
if (apiPort) { apiBase += ':' + apiPort }
if (apiPath) { apiBase += apiPath }

// Configure gzip compression
app.use(compression());

// Configure HTTP parser middleware (only log HTTP errors)
app.use(morgan('short', {
  skip: function (req, res) { return res.statusCode < 400 }, stream: process.stderr
}));

app.use(morgan('short', {
  skip: function (req, res) { return res.statusCode >= 400 }, stream: process.stdout
}));

// Configure bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// AngularJS app dependencies
app.use('/node_modules', express.static('node_modules'));

// Our AngularJS apps/assets
app.use('/app', express.static('app'));
app.use('/dist', express.static('dist'));
app.use('/landing', express.static('landing'));
app.use('/login', express.static('login'));
app.use('/dashboard', express.static('dashboard'));
app.use('/shared', express.static('shared'));
app.use('/asset', express.static('asset'));
app.use('/ConfigModule.js', express.static('ConfigModule.js'));
app.use('/swagger.yaml', express.static('swagger.yaml'));

// Use optimized versions of the images (drop-in)
app.use('/asset/png', express.static('dist/png'));
app.use('/asset/png/logos', express.static('dist/png/logos'));

// TODO: Restrict CORS
app.use(cors());

// Parse cookies into helpful structures for manipulation
app.use(cookieParser());

// Parse request body
app.use(bodyParser.json());

/** Log endpoint here */

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ 
      level: process.env.LOG_LEVEL || 'info',
      timestamp: function () {
          return (new Date()).toISOString();
      },
    }),
    
    // TODO: Log to file if we ever find a reason to do so
    /*new (winston.transports.File)({
      filename: 'webui.log',
      level: 'info'
    })*/
  ],
  exitOnError: false,
  emitErrs: false
});

// POST /logs => Echo logs to server console
app.post('/logs', function (req, res) {
  // TODO: Do we want to show ALL requests? or just authorized ones?
  
  // Return 401 unless a token is given
  // XXX: Are requests that don't require auth ignored?
  if (!req.body.token) {
    res.status(401).send('Unauthorized');
    return;
  } else {
    // FIXME: Check token validity
  }
  
  // Retrieve log metadata
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const timestamp = req.body.time;
  const level = req.body.type.toLowerCase();
  const username = req.body.token.namespace || "No Session";
  
  req.body.message.split('\n').forEach((jsonMessage) => {
    // Retrieve log message body / stacktrace
    const logBody = JSON.parse(jsonMessage);
    const message = logBody.message || logBody;
    const stack = logBody.stack || '';
    
    // For debug purposes:
    if (!message) {
      logger.log('warn', 'WARNING: Received messageless logBody: ', req.body);
    }
      
    // TODO: Is there a more compelling transformation for the POST body?
    logger.log(level, ip + " (" + username + ") -", message);
    if (stack) {
      logger.log(level, stack);
    }
  });

  // Return success
  res.status(201).send("Successfully POSTed to server logs!\n");

});

/** DefaultBackend endpoints here */

// Configure a route to our AngularJS dashboard app
app.get('/', function(req, res){
  // TODO: Experiment with using this container as the "Default Backend"
  //res.sendStatus(404);
  
  res.redirect('/landing/');
});

// Configure a route to our AngularJS dashboard app
app.get('/healthz', function(req, res){
  res.sendStatus(200);
});


/** CAuth endpoints/paths here */

// Simple auth endpoint
app.post('/cauth/login', bodyParser.urlencoded({ extended: false }), function (req, res) {
  
  // Pull username/password from POST body
  let username = req.body.username;
  logger.log("info", "Logging in: " + username);
  let postData = { 
      username: username, 
      password: req.body.password 
  };
  
  // Configure our POST target
  let postOptions = { 
    url: apiBase + '/authenticate', 
    method: 'POST', 
    body: JSON.stringify(postData),
    headers: {
      'Content-Type': 'application/json'
    }
  };
   
  // Generic error handler for this request
  req.on('error', function (err) {
    logger.log('error', 'Failed to send login request -', err);
  });
  
  // Send login request
  request(postOptions, function (error, response, responseBody) {
    let status = response && response.statusCode ? response.statusCode : 500;
    
    if (error || status >= 400) {
      logger.log('error', `Failed to login - ${status}: ${error}`); // Print the error if one occurred 
      logger.log('error', `   Details: ${responseBody}`); // Print the error if one occurred 
      res.sendStatus(status);
    } else {
      let body = JSON.parse(responseBody);
      let tokenString = body.token;
      //logger.log('info', `Logged in as ${username}: ${tokenString}`);
      
      if (tokenString) {
          // Attach token to response as a cookie
          res.cookie('token', tokenString, cookieOpts);
          res.cookie('namespace', username, cookieOpts);
          res.sendStatus(status);
      } else {
          res.sendStatus(401);
      }
    }
  });
});

// Serve our static login page
app.get('/cauth/sign_in', function (req, res) {
  res.sendFile(path.join(__dirname + '/login/'));
});

// Check to see if the current user is logged in
// NOTE: Current JWT secret is hostname (pod name) of apiserver
// TODO: Will we need a mechanism to share JWT secret? ConfigMap?
app.get('/cauth/auth', function(req, res) {
  // No token? Denied.
  let token = req.cookies['token'];
  logger.log("debug", "Checking user session: " + token);
  
  let requestedUrl = req.headers['x-original-url'];
  let prefix = secureCookie ? 'https://www' : 'http://www';
  let checkHost = '';
  
  if (!token) {
      res.sendStatus(401);
      return;
  } else if (requestedUrl.indexOf(prefix+cookieDomain) !== 0) {
     // if request starts with an arbitrary host (e.g. not 'www.'), 
     //    we need to check authorization
    checkHost = requestedUrl.replace(/https?:\/\//, '').replace(/\/.*$/, '');
    //logger.log("debug", `Checking token's access to ${checkHost}`);
  }

  // If token was given, check that it's valid
  http.get({ 
      protocol: apiProtocol,
      host: apiHost,
      port: apiPort,
      path: apiPath + '/check_token' + (checkHost ? '?host=' + checkHost : ''), 
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
      }
  }, 
  (resp) => {
    const { statusCode } = resp;

    let error;
    if (statusCode >= 400) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    }
    if (error) {
      logger.log('error', error.message);
      // consume response data to free up memory
      resp.resume();
      res.sendStatus(statusCode);
      return;
    }

    resp.setEncoding('utf8');
    let rawData = '';
    resp.on('data', (chunk) => { rawData += chunk; });
    resp.on('end', () => {
      try {
        logger.log('debug', rawData);
        res.sendStatus(200);
      } catch (e) {
        logger.log('error', e.message);
        res.sendStatus(statusCode);
      }
    });
  }).on('error', (e) => {
    logger.log('error', e.message);
    res.sendStatus(401);
  });
});

// Clear session info
app.get('/cauth/logout', function (req, res) {
  // TODO: Delete session somehow?

  res.clearCookie("token", cookieOpts);
  res.clearCookie("namespace", cookieOpts);
  res.sendStatus(200);
});

// NOTE: Wildcards need to be done last, after all other endpoints

/** Set up routes to our AngularJS apps here */
app.get('/landing/*', function(req, res) { res.sendFile('landing/index.html', { root: basedir || __dirname }); });
app.get('/login/*', function(req, res) { res.sendFile('login/index.html', { root: basedir || __dirname }); });
app.get('/dashboard/*', function(req, res) { res.sendFile('dashboard/index.html', { root: basedir || __dirname }); });

// Start up our server
app.listen(port, function () {
  logger.log('info', 'Workbench Login API listening on port', port);
  logger.log('info', 'Connecting to Workbench API server at ' + apiBase);
});
