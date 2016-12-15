var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//require mongoose - makes it possible to write object schemas for mongodb and makes it easier to work with the mongodb
var mongoose = require('mongoose');

//for authentication
var passport = require('passport');
// require the Post model
require('./models/Posts');
//require the Comments model
require('./models/Comments');
//require User model
require('./models/Users');
//require passport auth configuration file
require('./config/passport');

//if on bluemix we can connect get VCAP services so using this as a truth for production
if (process.env.VCAP_APP_PORT) {
  // get cfenv (cloud foundry environment) and ask it to parse the environment variable
  var cfenv = require('cfenv');

  var appEnv = cfenv.getAppEnv();

  // Within the application environment (appenv) there's a services object
  var services = appEnv.getServices();

// take the first bound MongoDB service and extract it's credentials object
var credentials = services['Compose for MongoDB-wk'].credentials;

//I got these notes/instructions from IBM docs:
// Within the credentials, an entry ca_certificate_base64 contains the SSL pinning key We convert that from a string into a Buffer entry in an array which we use when connecting.
var ca = [new Buffer(credentials.ca_certificate_base64, 'base64')];
	//grabbing the URI for the database from the credentials service object I got from the application environment
	var credentialsURI = credentials.uri;
	//I got these instructions for the SSL settings from IBM docs:
	// This is the MongoDB connection. Using mongoose I connect to that URI taken from the app environment, also pass a number of SSL settings to the call. Among those SSL settings is the SSL CA, into which we pass the array wrapped and now decoded ca_certificate_base64,
	mongoose.connect(credentialsURI, {
      mongos: {
          ssl: true,
          sslValidate: true,
          sslCA: ca,
          poolSize: 1,
          reconnectTries: 1
      }
    },
    function(err, db) {
      if (err) {
          console.log("Error connecting to the DB:", err);
      } 
      else { return; };
  		}
		);
	}
	else {
		//if running locally opens connection with the news db running on the local Mongo Server
		mongoose.connect('mongodb://localhost/news', function(err, db) {
			  if (err) {
	        console.log("Error connecting to the DB:", err);
	      } 
	      else { return; };
		});
}


//include routes to interact with server
var index = require('./routes/index');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
