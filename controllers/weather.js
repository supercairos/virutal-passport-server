var log = require('../libs/logger.js');
var passport = require('passport');
var util = require('util');

var config = require('../config/config.js');
var Forecast = require('forecast.io');

module.exports = function(app) {

	app.get('/weather/forecast/:latitude/:longitude', 
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
					forecasts: []
				};
				
				data.daily.data.forEach(function (element, index, array) {
					if(index > 6) {
						return;
					}
					
					var icon = 0;
					switch (element.icon) {
						case "clear-day":
						case "clear-night":
							icon = 0;
							break;
						case "cloudy":
							icon = 1;
							break;
						case "fog":
							icon = 2;
							break;
						case "partly-cloudy-day":
						case "partly-cloudy-night":
							icon = 3;
							break;
						case "rain":
							icon = 5;
							break;
						case "snow":
							icon = 6;
							break;
						case "sleet":
						case "wind":
						default:
							icon = 7;
							break;
					}
					out.forecasts.push({
						date: (element.time * 1000),
						min: element.temperatureMin,
						max: element.temperatureMax,
						icon: icon
					});
				});
				
				res.status(200)
				    // .setHeader('Cache-Control', ret.headers('Cache-Control')) // get forecast.io Cache-Control
				   .json(out)
				   .end();
			});
		}
	);
}