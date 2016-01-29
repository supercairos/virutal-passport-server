var log = require('../libs/logger.js');
var multer  = require('multer');
var passport = require('passport');
var geode = require('geode');
var request = require('request');

var Flickr = require("flickrapi");
var GooglePlaces = require('google-places');

var config = require('../config/config.js');

var MAX_PICTURE_SIZE = 1025 * 1025;

module.exports = function(app) {

	app.get('/cities/search', 
		passport.authenticate('bearer', { session: false }), 
		function(req, res){
			new GooglePlaces(config.get("google:place:key")).autocomplete({
					input: req.query.query, 
					types: "(cities)"
				}, function(err, response) {
					if (err) {
						return next(new NetworkException(err.message, 1));
					}
					
					// log.info("autocomplete: ", response.predictions);
					var out = [];
					response.predictions.forEach(function (element, index) {
						out.push({
							name: element.description,
							placeid: element.place_id
						})
					});
					
					res.status(200)
					   .header('Cache-Control', 'no-cache')
					   .json(out)
					   .end();
				}
			);
		}
	);
	
	app.get('/cities/resolve/:placeid',
		passport.authenticate('bearer', { session: false }), 	
		function(req, res, next) {
			new GooglePlaces(config.get("google:place:key")).details({
					placeid: req.params.placeid
				}, function(err, response) {
					if (err) {
						return next(new NetworkException(err.message, 1));
					}
					
					var name;
					var country;
					response.result.address_components.forEach(function (element, index) {
						if (element.types.indexOf("locality") > -1) {
							name = element.long_name;
						} else if (element.types.indexOf("country") > -1) {
							country = element.long_name;
						}
					});
					
					var latitude = response.result.geometry.location.lat;
					var longitude = response.result.geometry.location.lng;					
					getFlickrUrl(latitude, longitude, function (url) {
						log.info("Url : ", url);
						if(url) {
							res.status(200)
							   .header('Cache-Control', 'no-cache')
							   .json({
									name: name ? name : element.description,
									country: country ? country : "",
									latitude: latitude,
									longitude: longitude,
									picture: url
								})
							   .end();
						} else {
							res.status(200)
							   .header('Cache-Control', 'no-cache')
							   .json({
									name: name ? name : element.description,
									country: country ? country : "",
									latitude: latitude,
									longitude: longitude
								})
							   .end();
						}
					});
				}
			);
		}
	);
	
	app.get('/cities/picture/:latitude/:longitude', 
		// passport.authenticate('bearer', { session: false }),
		function(req, res, next) {
			getFlickrUrl(req.params.latitude, req.params.longitude, function (url) {
				res.status(200)
				   .header('Cache-Control', 'no-cache')
				   .send(url)
				   .end();
			});
		}
	);
	
	function getFlickrUrl(latitude, longitude, next) {
		Flickr.tokenOnly({
		  api_key: config.get("flickr:api_key"),
		  secret: config.get("flickr:secret")
		}, function(error, flickr) {
			if (error) {
				return next(new NetworkException(err.message, 1));
			}

			flickr.photos.search({
				sort : "interestingness-desc",
				privacy_filter : 1,
				accuracy : 9,
				safe_search : 1,
				content_type : 1,
				group_id : "1463451@N25",
				lat : latitude,
				lon : longitude,
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
								if(current < MAX_PICTURE_SIZE || !url) {
									url = element.source;
								}
							}
						});
						
						next(url);
					});
				} else {
					next();
				}
			});
		});
	}
}