var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//Create a middleware for authenticating jwt tokens.
// The userPropery option specifies which property on req to put our payload from our tokens. By default it's set on user but we're using payload instead to avoid any conflicts with passport (it shouldn't be an issue since we aren't using both methods of authentication in the same request). This also avoids confusion since the payload isn't an instance of our User model. The secret has to be the same secret used in the User model in the generateJWT() method.
var auth = jwt({secret: 'S1234XYZ$', userProperty: 'payload'});

//route to create new user
router.post('/register', function(req, res, next){
	//if no username or password is provided no user wil be created
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  // instantiate new user
  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err){
    if(err){ return next(err); }
    //returns a JWT token if save is successful
    return res.json({token: user.generateJWT()})
  });
});

//route for user login
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }
//passport.authenticate('local') middleware uses the LocalStrategy that was created in the User model
  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
    	//If authentication is successful we want to return a JWT token to the client just like the register route does.
      return res.json({token: user.generateJWT()});
    } else {
    	//using a custom callback for the authenticate middleware so it can return error messages to the client that were made in passport.js
      return res.status(401).json(info);
    }
  })(req, res, next);
});

//route for preloading post objects. Uses mongoose's query interface. Instead of duplicating code across request handler functions, this uses express's param() function to automatically load an object. Now when there is a route URL with a :post in it, this function will be run first, assuming the parameter contains an objectID. this function will retrieve a post object from the db and attach it to the req object after which the route handler will be called
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

router.get('/posts', function(req, res, next) {
	Post.find(function(err, posts){
		// If and error occurred, pass the error to an error handling function 
		if(err) { return next(err); }

		//return json list that contains all posts
		res.json(posts);
	})
})

//create new post

//use the middleware (auth) defined above to require authentication on specific routes that allow user to write to the application, such as when they are posting or commenting. adding the middleware to the server request will require the user be authenticated
router.post('/posts', auth, function(req, res, next) {
	var post = new Post(req.body);
	//associate the author of the post with the username which we can get directly from the token's payload. Using the payload also saves a ping to the databse. This same method will be used when creating comments
	post.author = req.payload.username;

	post.save(function(err, post){
		if(err) { return next(err); }

		res.json(post);
	})
})

//get specific post. Use the populate() function to retrieve comments along with posts
router.get('/posts/:post', function(req, res, next) {
  req.post.populate('comments', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});

//upvote a post
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

//downvote a post
router.put('/posts/:post/downvote', auth, function(req, res, next) {
  req.post.downvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

//param function for comment object
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

//create a new comment for a post
router.post('/posts/:post/comments', auth, function(req, res, next) {
	var comment = new Comment(req.body);

	comment.post = req.post;

	comment.author = req.payload.username;

	comment.save(function(err, comment){
		if(err) { return next(err); }

		req.post.comments.push(comment);

		req.post.save(function(err, post) {
			if(err){ return next(err); }

			res.json(comment);
		})
	})
})

//upvote comment
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {

  req.comment.upvote(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});


module.exports = router;
