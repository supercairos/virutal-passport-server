var User = require('../models/User.js');
var NetworkException = require('../models/NetworkException.js');

var log = require('../libs/logger.js');
var multer  = require('multer');
var request = require('request');
var passport = require('passport');
var path = require('path');

var Flickr = require("flickrapi");

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
	
	app.get('/pictures/:lat/:lon', 
		// passport.authenticate('bearer', { session: false }), 
		function(req, res){
			Flickr.tokenOnly({
			  api_key: "50ce3b858e5d2e847d26ce7ee56f7bce",
			  secret: "86aa46059054f8ef"
			}, function(error, flickr) {
				if (error) {
					return next(new NetworkException(err.message, 1));
				}
				
				// we can now use "flickr" as our API object
				// https://api.flickr.com/services/rest/?
				// method=flickr.photos.search&
				// sort=interestingness-desc&
				// privacy_filter=1&
				// accuracy=9&
				// safe_search=1&
				// content_type=1&
				// group_id=1463451%40N25&
				// lat=47.438889&
				// lon=0.640278&
				// extras=original_format&
				// per_page=1&
				// format=json&
				// nojsoncallback=1
				
				flickr.photos.search({
					sort : "interestingness-desc",
					privacy_filter : 1,
					accuracy : 9,
					safe_search : 1,
					content_type : 1,
					group_id : "1463451@N25",
					lat : req.params.lat,
					lon : req.params.lon,
					extras : "original_format",
					per_page : 1,
					format : "json",
					nojsoncallback : 1
				}, function(err, result) {
					if (err) {
						return next(new NetworkException(err.message, 1));
					}
					// do something with result
					var url;
					if(result.photos.photo.length > 0) {
						var photo = result.photos.photo[0];
						flickr.photos.getSizes({
							photo_id : photo.id
						}, function(err, result) {
							if (err) {
								return next(new NetworkException(err.message, 1));
							}
							
							var sizes = result.sizes.size;
							var current = 0;
							var url;
							sizes.forEach(function (element, index, array) {
								if((element.width * element.height) > current) {
									current = element.width * element.height;
									url = element.source;
								}
							});
							
							log.info("Url : ", url);
							req.pipe(request(url)).pipe(res)
						});
					} else {
						res.status(404).end();
					}
				});
			});
		}
	);
}