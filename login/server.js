const path = require('path');
const http = require('http');
const request = require('request');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

// Our ExpressJS app
const app = express();
const port = 8081;

// Build up a Workbench API URL
const apiProtocol = 'http:'; // HTTP, since this isn't going through the loadbalancer
const apiHost = process.env.NDSLABS_APISERVER_SERVICE_HOST || 'localhost';
const apiPort = process.env.NDSLABS_APISERVER_SERVICE_PORT || '';
const apiPath = '/api';
let apiBase = apiProtocol + '//' + apiHost;
if (apiPort) { apiBase += ':' + apiPort }
if (apiPath) { apiBase += apiPath }

// TODO: Restrict CORS
app.use(cors());

// Parse cookies into helpful structures for manipulation
app.use(cookieParser());

// Parse request body
app.use(bodyParser.json());

// Simple auth endpoint
app.post('/cauth/login', bodyParser.urlencoded({ extended: false }), function (req, res) {
    // Pull username/password from POST body
    let postData = { 
        username: req.body.username, 
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
        console.log('ERROR: failed to send login request -', err);
    });
    
    // Send login request
    request(postOptions, function (error, response, responseBody) {
        console.log("ERROR: ", error);
        console.log("RESPONSE: ", response);
        console.log("RESPONSE BODY: ", responseBody);

        let status = response && response.statusCode ? response.statusCode : 500;
        
        if (error || status >= 400) {
            console.log('ERROR: Failed to login -', status, error); // Print the error if one occurred 
            res.sendStatus(status);
        } else {
            let body = JSON.parse(responseBody);
            
            if (body.token) {
                // Attach token to response as a cookie
                let cookieOpts = { domain: req.get('host') /* || req.get('origin') */ };
                res.cookie('token', body.token, cookieOpts);
                res.cookie('namespace', req.body.username, cookieOpts);
                res.sendStatus(status);
            } else {
                res.status(500);
                res.send("No token was provided.");
            }
        }
    });
});

// Serve our static login page
app.get('/cauth/sign_in', function (req, res) {
  res.sendFile(path.join(__dirname + '/static/login.html'));
});

// Check to see if the current user is logged in
// NOTE: Current JWT secret is hostname (pod name) of apiserver
// TODO: Will we need a mechanism to share JWT secret? ConfigMap?
app.get('/cauth/auth', function(req, res) {
    // No token? Denied.
    let token = req.cookies['token'];
    if (!token) {
        res.sendStatus(401);
        return;
    }

    // If token was given, check that it's valid
    http.get({ 
        protocol: apiProtocol,
        host: apiHost,
        port: apiPort,
        path: apiPath + '/check_token', 
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }, (resp) => {
        const { statusCode } = resp;

        let error;
        if (statusCode >= 400) {
          error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        }
        if (error) {
          console.error(error.message);
          // consume response data to free up memory
          resp.resume();
          res.sendStatus(200);
          return;
        }

        resp.setEncoding('utf8');
        let rawData = '';
        resp.on('data', (chunk) => { rawData += chunk; });
        resp.on('end', () => {
          try {
            console.log(rawData);
            res.sendStatus(200);
          } catch (e) {
            console.error(e.message);
            res.sendStatus(401);
          }
        });
      }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
        res.sendStatus(401);
      });
});

// Clear session info
app.get('/cauth/logout', function (req, res) {
  // TODO: Delete session somehow?

  res.status(501);
  res.send('STUB: Session deleted!')
  //jwt.clear()
});


// Serve static files from ./static/ on disk
// TODO: node_modules/bower_components may require special handling
app.use(express.static(path.join(__dirname, 'static')));

// Catch-all for other pages, send to /sign_in
app.get('/*', function(req, res) {
  res.redirect('/sign_in');
});

// Start up our server
app.listen(port, function () {
  console.log('Workbench Login API listening on port', port)
  console.log('Connecting to Workbench API server at ' + apiBase);
});
