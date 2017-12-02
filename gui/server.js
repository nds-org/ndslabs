// Import utilities
const util = require('util');

// Import winston for logging
var winston = require('winston');

// Import express and middleware modules
var express = require('express');
var compression = require('compression')
var bodyParser = require('body-parser');
var morgan = require('morgan');

// Declare a new express app
var app = express();

var basedir = process.env.BASEDIR;
var port = 3000;

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({ level: 'warn' }),
    
    // TODO: Log to file if we ever find a reason to do so
    /*new (winston.transports.File)({
      filename: 'webui.log',
      level: 'info'
    })*/
  ],
  exitOnError: false,
  emitErrs: false
});

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

// Our AngularJS apps/assets
app.use('/app', express.static('app'));
app.use('/dist', express.static('dist'));
app.use('/landing', express.static('landing'));
app.use('/login', express.static('login'));
app.use('/dashboard', express.static('dashboard'));
app.use('/shared', express.static('shared'));
app.use('/asset', express.static('asset'));
app.use('/ConfigModule.js', express.static('ConfigModule.js'));

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
  var level = req.body.type.toLowerCase();
  var username = req.body.token.namespace || "No Session";

  // Retrieve log message body / stacktrace
  var logBody = JSON.parse(req.body.message);
  var message = logBody.message || logBody;
  var stack = logBody.stack || '';
  
  // For debug purposes:
  if (!message) {
    logger.log(level, 'Received messageless logBody: ', req.body);
  }
    
  // TODO: Is there a more compelling transformation for the POST body?
  logger.log(level, timestamp + " | " + ip + " (" + username + ") -", message);
  if (stack) {
    logger.log(level, stack);
  }

  // Return success
  res.status(201).send("Successfully POSTed to server logs!\n")
});


// Configure a route to our AngularJS landing app
app.get('/landing*', function(req, res){
  res.sendFile('landing/index.html', { root: basedir || __dirname });
});

// Configure a route to our AngularJS login app
app.get('/login*', function(req, res){
  res.sendFile('login/index.html', { root: basedir || __dirname });
});

// Configure a route to our AngularJS dashboard app
app.get('/dashboard*', function(req, res){
  res.sendFile('dashboard/index.html', { root: basedir || __dirname });
});

// Configure a route to our AngularJS dashboard app
app.get('/', function(req, res){
  res.status(404).send("Not Found")
});

// Configure a route to our AngularJS dashboard app
app.get('/healthz', function(req, res){
  res.status(200).send("OK")
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
