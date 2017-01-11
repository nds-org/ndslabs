// Import utilities
const util = require('util');

// Import express and middleware modules
var express = require('express');
var bodyParser = require("body-parser");

// Declare a new express app
var app = express();

// Configure bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// POST /logs => Echo logs to server console
app.post('/logs', function (req, res) {
  // TODO: Do we want to show ALL requests? or just authorized ones?

  if (!req.body.token) {
    res.status(401).send('Unauthorized');
    return;
  } else {
    // FIXME: Check token validity
  }

  // TODO: Is there a more compelling transformation for the POST body?
  console.log(util.inspect(req.body, false, null));

  // Return success
  res.status(201).send('Successfully POSTed to server logs!')
});

// Configure default route to serve up our AngularJS app
app.get('/',function(req,res){
  res.sendfile("index.html");
});

// Start server on port 3000
app.listen(3000, function () {
  console.log('logserve listening on port 3000!');
});
