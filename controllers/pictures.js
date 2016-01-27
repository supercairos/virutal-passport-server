var User = require('../models/User.js');
var NetworkException = require('../models/NetworkException.js');
var log = require('../libs/logger.js');
var multer  = require('multer');
var request = require('request');
var passport = require('passport');
var path = require('path');
var config = require('../config/config.js');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  
  filename: function (req, file, cb) {
	var ext = path.extname(file.originalname);
	var size = file.originalname.length;
	cb(null, file.originalname.substring(0, size > 10 ?  10 : size).replace(/\W+/g, '-').toLowerCase() + Date.now() + ext)
  }
})
var upload = multer({ storage: storage })

module.exports = function(app) {

	app.post('/pictures/upload', 
		passport.authenticate('bearer', { session: false }), 
		upload.single('file'), 
		function(req, res){
			var url = 'http://' + req.headers.host + '/' + req.file.path;
			url = url.replace('\\', '/');
			log.info("Url is : %s", url);
			User.findOneAndUpdate(
				{ token : req.user.token }, 
				{ picture : url }, 
				{ new : true},
				function (err, user) {
					if (err || !user) {
						return next(new NetworkException(err.message, 1));
					}
					
					res.status(201).json(user).end();
				}
			);
		}
	);
}