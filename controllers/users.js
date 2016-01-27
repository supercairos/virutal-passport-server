var User = require('../models/User.js');
var NetworkException = require('../models/NetworkException.js');

var log = require('../libs/logger.js');

var GcmSender = require('../libs/gcm.js');
var gcm = require('node-gcm');
var passport = require('passport');
var crypto = require('crypto');

/**
 * This file is the controller for the /users root node; It will handle Signup, Login, Logout, PasswordReset and so on;
 **/

module.exports = function(app) {

	/**
	 * This is the signup action; Pass a valid JSON body containing at least 
	 **/
	app.post('/users/register', 
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
			
			if (!req.body.password) {
				return next(new NetworkException("A request with no password was made", 1));
			}
			
			next();
		}, 
		function (req, res, next) {
			User.where({ email: req.body.email.trim() })
				.findOne( function(err, user) {
					if (err) {
						return next(new NetworkException(err.message, 1));
					}

					if (user) {
						return next(new NetworkException("This user :" + req.body.email + " already exist", 1));
					}
				});
				
			next();
		},
		function (req, res) {
			var myUser = new User({
				email: req.body.email.trim(),
				name: req.body.name.trim(),
				password: User.hash(req.body.password.trim()),
				token: crypto.randomBytes(256).toString('hex')
			});

			myUser.save(function (err, user) {
				if (err){
					return next(new NetworkException(err.message, 1));
				} 
				
				log.info("A new user registered %s (token:%s)", user.email, user.token);
				res.status(201)
				   .setHeader('Cache-Control', 'no-cache')
				   .json( user )
				   .end();
			});
	});

	app.put('/users/gcm/:gcm_token', 
		passport.authenticate('bearer', { session: false }), 
		function(req, res) {
			req.user.update({ gcm_token : req.params.gcm_token }, function (err, affected, raw) {
				if (err) {
					return next(new NetworkException(err.message, 1));
				}
				log.info('The number of updated documents was %s', affected);
				res.status(201)
				   .setHeader('Cache-Control', 'no-cache')
				   .end();
			});
		}
	);

	app.get('/users/login', 
		passport.authenticate('basic', { 
			session: false 
		}), 
		function(req, res) {
			res.status(200)
			   .setHeader('Cache-Control', 'no-cache')
			   .json( req.user )
			   .end();
		}
	);

	// These functions are for testing / showcasing purposes.
	app.get('/users/gcm', function(req, res) {
		// or with object values
		var message = new gcm.Message({
		    collapseKey: 'demo',
		    delayWhileIdle: true,
		    timeToLive: 3,
		    data: {
		        key1: 'message1',
		        key2: 'message2'
		    }
		});

		
		User.find(function (err, users) {
			if (err){
				return next(new NetworkException(err.message, 1));
			} 
			
			var registrationIds = [];

			users.forEach(function(entry) {
				if(entry.gcm_token){
				    log.info("Adding regid : %s", entry.gcm_token);
				    registrationIds.push(entry.gcm_token);
			    }
			});

			if (registrationIds.length > 0) {
				GcmSender.send(message, registrationIds, 4, function (err, result) {
					if (err) {
						return next(new NetworkException(err.message, 1));
					}

				    log.info(result);
				    res.sendStatus(200);
				    return;
				});
			} else {
				log.error("Could not find any user to send notif to :(");
				res.sendStatus(500);
			}
		});	
	});
}
