var log = require('../libs/logger.js');

module.exports = function(app) {

	app.get('/', 
		//passport.authenticate('bearer', { session: false }), 
		function (req, res) {
			res.send('hello world');
		}
	);

}