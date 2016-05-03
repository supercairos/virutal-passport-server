var database = require('../config/db.js');
var log = require('../libs/logger.js');

var crypto = require('crypto');

function obfuscate (cc) {
  return '*******';
}

var UsersSchema = database.Schema({
    email: { type: String, index: true, required: '{PATH} is required!', trim: true, unique: true},
    name: { type: String, index: true, required: '{PATH} is required!', trim: true},
    password: { type: String, minLength: [5, 'The value of password `{PATH}` (`{VALUE}`) is shorter than the minimum allowed length ({MINLENGTH}).'], get: obfuscate, select: false},
    token: { type: String, select: false},
	picture: String,
    gcm_token: { type: String, select: false},
});

// This is a static method;
UsersSchema.statics.hash = function(password){
	return  crypto.createHash("sha256").update(password, "utf8").digest("base64"); 
}

UsersSchema.methods.compareHash = function (otherPassword) {
	return this.password == UsersSchema.statics.hash(otherPassword);
}

module.exports = database.model('Users', UsersSchema);