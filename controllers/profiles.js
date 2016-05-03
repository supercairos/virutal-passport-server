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

	app.put('/profiles/picture', 
		passport.authenticate('bearer', { session: false }), 
		upload.single('file'), 
		function(req, res, next){
			var url = 'http://' + req.headers.host + '/' + req.file.path;
			url = url.replace('\\', '/');
			log.info("Url is : %s", url);
			User.findByIdAndUpdate(
					req.user._id, 
					{ picture : url }, 
					{ new : true, runValidators: true, select : '-__v' },
					function (err, user) {
						if (err || !user) {
							return next(new NetworkException(err.message, 1));
						}
						
						res.status(200).json(user).end();
					}
				);
		}
	);
	
	app.delete('/profiles',
		passport.authenticate('bearer', { session: false }), 
		function (req, res, next) {
			User.findByIdAndRemove(
				req.user._id, 
				function (err, user) {
					if (err || !user) {
						return next(new NetworkException(err.message, 1));
					}
					
					res.status(204).json(user).end();
				}
			)
		}
	);
	
	app.put('/profiles',
		passport.authenticate('bearer', { session: false }), 
		function (req, res, next) {
			if (!req.body) {
				return next(new NetworkException("A request with no body was made", 1));
			}
			
			if (!req.body.email) {
				return next(new NetworkException("A request with no email was made", 1));
			}
			
			if (!req.body.name) {
				return next(new NetworkException("A request with no name was made", 1));
			}
			
			next();
		},
		function(req, res, next){
			User.findByIdAndUpdate(
					req.user._id, 
					{ name : req.body.name, email : req.body.email }, 
					{ new : true, runValidators: true, select : '-__v' },
					function (err, user) {
						if (err || !user) {
							return next(new NetworkException(err.message, 1));
						}
						
						res.status(201).json(user).end();
					}
				);
		}
	);
	
	app.get('/profiles/:id',
		passport.authenticate('bearer', { session: false }), 
		function(req, res, next) {
			User.findById(req.params.id, 
				'-__v',
				function (err, user, next) {
					if (err || !user) {
						return next(new NetworkException(err.message, 1));
					}
					
					res.status(200).json(user).end();
				});
		}
	);
	
	app.get('/profiles',
		passport.authenticate('bearer', { session: false }), 
		function(req, res, next) {
			User.find(req.params.id, 
				'-__v',
				function (err, users) {
					if (err || !users) {
						return next(new NetworkException(err.message, 1));
					}
					
					res.status(200).json(users).end();
				});
		}
	);
}