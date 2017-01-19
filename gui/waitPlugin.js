var q = require('q');

var waitList = [];
var onComplete;

exports.waitList = waitList;

exports.setOnComplete = function(cb) {
  onComplete = cb;
};

exports.teardown = function () {
  return q.all(waitList)
      .then(function() {
        if (onComplete) {
          return onComplete();
        }
      });
};
