var mongoose = require('mongoose');
var config = require('./config.js');
var logger = require('../libs/logger.js');

var mongoose_uri = process.env.OPENSHIFT_MONGODB_DB_URL || config.get("mongoose:uri")

mongoose.connect(mongoose_uri + config.get("mongoose:name"));

mongoose.connection.on('error', function callback() {
	logger.error('Could not connect to %s', mongoose_uri + config.get("mongoose:name"));
});

mongoose.connection.once('open', function callback () {
	logger.info('Database is connected to %s', mongoose_uri + config.get("mongoose:name"));
});


module.exports = mongoose;