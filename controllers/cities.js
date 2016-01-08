var log = require('../libs/logger.js');
var multer  = require('multer');
var passport = require('passport');
var geode = require('geode');
var geonames = new geode('supercairos');

module.exports = function(app) {

	app.get('/cities/search', 
		passport.authenticate('bearer', { session: false }), 
		function(req, res){
			geonames.search({ 
				name: req.query.query, 
				name_startsWith: req.query.query, 
				maxRows : 5, 
				lang : 'local', 
				featureClass: 'P',
				fuzzy : 0.95
			}, function(err, collection){
				var out = [];
				collection.geonames.forEach(function (element, index) {
					out.push({
						name: element.name,
						country: element.countryName,
						latitude: element.lat,
						longitude: element.lng,
					});
					log.info("%s, %s (%d,%d)", element.name, element.countryName, element.lat, element.lng);
				});
				
				res.status(200).json( out ).end();
			});
		}
	);

}