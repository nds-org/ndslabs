/* global console:false */

(function() {
  "use strict";   
  
  // Import swagger-js-codegen
  var fs = require('fs');
  var YAML = require('yamljs');
  var CodeGen = require('swagger-js-codegen').CodeGen;
  
  // Parse YAML spec
  var file = 'ndslabs.yaml';
  var spec = YAML.parse(fs.readFileSync(file, 'UTF-8'));
   
  // Now generate AngularJS sources
  var json = JSON.stringify(spec);
  console.log(json);
})();