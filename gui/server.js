// Import utilities
const util = require('util');

// Import express and middleware modules
var express = require('express');
var compression = require('compression')
var bodyParser = require('body-parser');
var morgan = require('morgan');

// Declare a new express app
var app = express();

var basedir = process.env.BASEDIR;
var port = 3000;

// Configure gzip compression
app.use(compression())

// Configure HTTP parser middleware (only log HTTP errors)
app.use(morgan('combined', {
  skip: function (req, res) { return res.statusCode < 400 }
}));

// Configure bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// AngularJS app dependencies
app.use('/bower_components', express.static('bower_components'));

// Our AngularJS app
app.use('/app', express.static('app'));
app.use('/dist', express.static('dist'));

// Use optimized versions of the images (drop-in)
app.use('/asset/png', express.static('dist/png'));
app.use('/asset/png/logos', express.static('dist/png/logos'));

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
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var timestamp = req.body.time;
  var type = req.body.type;
  var username = req.body.token.namespace || "No Session";

  // Retrieve log message body / stacktrace
  var logBody = JSON.parse(req.body.message);
  var message = logBody.message || logBody;
  var stack = logBody.stack || '';
  if (!message) {
    console.log('Received messageless logBody: ', req.body);
  }
    
  // TODO: Is there a more compelling transformation for the POST body?
  console.log(timestamp + " [" + type + "] " + ip + " (" + username + ") -", message);
  if (stack) {
    console.log(stack);
  }

  // Return success
  res.status(201).send("Successfully POSTed to server logs!\n")
});

// Configure catch-all route to serve up our AngularJS app
// NOTE: Wildcard needs to be done last, after all other endpoints
app.get('*', function(req, res){
  res.sendFile('index.html', { root: basedir || __dirname });
});

// Start server on port 3000
app.listen(port, function () {
  console.log('Server is listening on port ' + port + '...');
});
