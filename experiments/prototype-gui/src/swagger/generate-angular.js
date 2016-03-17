// Import swagger-js-codegen
var fs = require('fs');
var CodeGen = require('swagger-js-codegen').CodeGen;
 
// Parse in our swagger spec
var file = 'swagger/ndslabs.json';
var swagger = JSON.parse(fs.readFileSync(file, 'UTF-8'));

// Now generate AngularJS source
var angularjsSourceCode = CodeGen.getAngularCode({ moduleName: 'ndslabs-api', className: 'ApiServer', swagger: swagger });
console.log(angularjsSourceCode);
