'use strict';
var util = require('util');

module.exports = function NetworkException(message, extra) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.extra = extra;
};

util.inherits(module.exports, Error);