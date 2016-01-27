var log = require('../libs/logger.js');
var passport = require('passport');
var util = require('util');

var config = require('../config/config.js');
var Forecast = require('forecast.io');

module.exports = function(app) {

	app.get('/weather/:latitude/:longitude', 
		passport.authenticate('bearer', { session: false }), 
		function(req, res, next){
			var forecast = new Forecast({
				APIKey: config.get("forecast.io:key"),
				timeout: 1000
			});
			
			forecast.get(req.params.latitude, req.params.longitude, {
				exclude: 'timezone,offset,currently,minutely,hourly,flags,alerts',
				units: 'si'
			}, function (err, ret, data) {
				if (err) {
					log.error(err);
					return next(new NetworkException("A request with no body was made", 1));
				}

				var out = {
					forecast: []
				};
				
				data.daily.data.forEach(function (element, index, array) {
					log.info(index + " t = " + element.time + " min = " + element.temperatureMin + " max = " + element.temperatureMax + " icon = " + element.icon);
					out.forecast.push({
						date: element.time,
						min: element.temperatureMin,
						max: element.temperatureMax,
						icon: element.icon
					});
				});
				
				res.status(200).json(out).end();
			});
		}
	);
}