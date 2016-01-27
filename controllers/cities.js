var log = require('../libs/logger.js');
var multer  = require('multer');
var passport = require('passport');
var geode = require('geode');
var request = require('request');
var Flickr = require("flickrapi");

var config = require('../config/config.js');

var MAX_PICTURE_SIZE = 1025 * 1025;

module.exports = function(app) {

	app.get('/cities/search', 
		passport.authenticate('bearer', { session: false }), 
		function(req, res){
			var geonames = new geode(config.get("geoname:username"));
			geonames.search({ 
				name: req.query.query, 
				name_startsWith: req.query.query, 
				maxRows : 5, 
				lang : 'local', 
				featureClass: 'P',
				fuzzy : 0.95
			}, function(err, collection){
				var out = [];
				if(collection.totalResultsCount > 0 && collection.geonames) {
					collection.geonames.forEach(function (element, index) {
						out.push({
							name: element.name,
							country: element.countryName,
							latitude: element.lat,
							longitude: element.lng,
							picture: 'http://' + req.headers.host + '/cities/' + element.lat + '/' + element.lng
						});
					});
				}
				
				res.status(200).json( out ).end();
			});
		}
	);
	
	app.get('/cities/:lat/:lon', 
		passport.authenticate('bearer', { session: false }), 
		function(req, res){
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
									if(current < MAX_PICTURE_SIZE || !url) {
										url = element.source;
									}
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