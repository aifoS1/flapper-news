 
// Passport uses strategies for different authentication methods (password, GitHub, Facebook, etc.) that are split out into separate modules. I'll be using the passport-local strategy to handle username/password authentication. 

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

//create a new instance of the localStrategy where the logic on how to authenticate a user given a username and password. The function calls the validPassword method in the User Schema.

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      //if an exception occurred while verifying the credentials (for example, if the database is not available), done should be invoked with an error, in conventional Node style.
      if (err) { return done(err); }
     //Authentication failures are natural conditions, in which the server is operating normally. Ensure that err remains null, and use the final argument to pass additional details.
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      //If the credentials are not valid (for example, if the password is incorrect), done should be invoked with false instead of a user to indicate an authentication failure. An additional info message can be supplied to indicate the reason for the failure. This is useful for displaying a flash message prompting the user to try again.
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
       // When Passport authenticates a request, it parses the credentials contained in the request. It then invokes the verify callback with those credentials as arguments, in this case username and password. If the credentials are valid, the verify callback invokes done to supply Passport with the user that authenticated.
      return done(null, user);
    });
  }
));