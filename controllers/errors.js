var log = require('../libs/logger.js');
var passport = require('passport');
var util = require('util');

module.exports = function(app) {
	app.use(function (err, req, res, next) {
			log.error("Got : " + err.message + " (code : " + err.code + ")");
			res.status(500)
			   .header('Cache-Control', 'no-cache')
			   .send({ message: err.message, code: err.extra })
			   .end();
		}
	);
}