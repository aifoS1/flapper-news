var mongoose = require('mongoose');
//module that comes with node that hash's passwords
var crypto = require('crypto');
//npm module that helps us generate JWT tokens
var jwt = require('jsonwebtoken');

//since we don't want to save user pw in plain text we will store it in a hash
var UserSchema =  new mongoose.Schema({
	username:{ type: String, lowercase: true, unique: true},
	hash: String,
	salt: String
});

//setPassword method on user model accepts a password then generates a salt and associated password hash.
UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

//make sure the iterations and key length in our setPassword() method match the ones in our validPassword() method
UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};
//create a JWT token (JSON web token) for user. The first argument of the jwt.sign() method is the payload that gets signed. Both server and client will have access to the payload. The exp value is a Unix timestamp in seconds that will specify when the token expires (in this it's 60 days from now). The second argument is the secret used to sign our tokens. It's hard coded here but will eventually become an evironmental variable.
UserSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, 'S1234XYZ$');
};

mongoose.model('User', UserSchema)