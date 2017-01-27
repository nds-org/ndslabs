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
   
  // Now generate AngularJS source
  var angularjsSourceCode = CodeGen.getAngularCode({ moduleName: 'ndslabs-api', className: 'ApiServer', swagger: spec });
  console.log(angularjsSourceCode);
})();