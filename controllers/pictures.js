var log = require('../libs/logger.js');
var multer  = require('multer');
var passport = require('passport');
var path = require('path');

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

	app.post('/pictures', 
		passport.authenticate('bearer', { session: false }), 
		upload.single('file'), 
		function(req, res){
			log.info("%o", req.file);
			var hostname = req.headers.host;
			res.status(200).json({ status : 'OK', path : 'http://' + hostname + '/' + req.file.path}).end()
		}
	);
}