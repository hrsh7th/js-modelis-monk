var slice = Array.prototype.slice;
var Promise = require('promise');

module.exports = function(callback, fn) {
  return new Promise(function(resolve, reject) {
    fn(function() {
      var args = slice.call(arguments);
      callback.apply(null, [null].concat(args));
      resolve.apply(null, args);
    }, function() {
      var args = slice.call(arguments);
      callback.apply(null, args);
      reject.apply(null, args);
    });
  });
};

