var log = require('../libs/logger.js');
var multer  = require('multer');
var passport = require('passport');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {  
	cb(null, file.filename.replace(/\W+/g, '-').toLowerCase() + Date.now())
  }
})
var upload = multer({ storage: storage })

module.exports = function(app) {

	app.post('/pictures', 
		//passport.authenticate('bearer', { session: false }), 
		upload.single('file'), 
		function(req, res){
			log.info(JSON.parse(req.body.picture));
			log.info(req.files);
			res.status(204).end()
			
		}
	);

}