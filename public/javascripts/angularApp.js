//flapperNews is the module name and app name that is loaded in the html. The app needs to be loaded onto the html via ng-app since angular first looks for the app name then finds a controller from there. The 'MainCtrl' is the name of the controller on the flapperNews module that is loaded onto the html which contains the $scope. The $scope allows controllers to interact and share data with angular templates.  For example, $scope.test = 'hello world' will be loaded via html as {{ test }} and you'll see 'hello world' on the browser. This is an example of Angular's two-way binding.
// the ui-router dependancy is injected into the app because it's an external module.
var app = angular.module('flapperNews', ['ui.router']);

//with ui-router included, config() is used to set up the home state and posts state will display comments assoicated w a post via $stateProvider and $urlRouterProvider. Otherwise() is used to redirect unspecified routes. {id} is a route parameter that will be made available to the controller


app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		$stateProvider
			.state('home', {
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				//By using the resolve property below, we are ensuring that anytime our home state is entered, we will automatically query all posts from our backend before the state actually finishes loading.
				resolve: {
					postPromise: ['posts', function(posts){
						return posts.getAll();
					}]
				}
			})
			.state('posts', {
				url: '/posts/{id}',
				templateUrl: '/posts.html',
				controller: 'PostsCtrl',
				resolve: {
					post: ['$stateParams', 'posts', function($stateParams, posts) {
						return posts.get($stateParams.id);
					}]
				}			
			})
			.state('login', {
			  url: '/login',
			  templateUrl: '/login.html',
			  controller: 'AuthCtrl',
			  //upon entering site you'll be prompted to log in/ or register view the home view. If you are logged in the user will be automatically redirect to the home view
			  onEnter: ['$state', 'auth', function($state, auth){
			    if(auth.isLoggedIn()){
			      $state.go('home');
			    }
			  }]
			})
			.state('register', {
			  url: '/register',
			  templateUrl: '/register.html',
			  controller: 'AuthCtrl',
			  //upon entering site you'll be prompted to log in/ or register view the home view. If you are logged in the user will be automatically redirect to the home view
			  onEnter: ['$state', 'auth', function($state, auth){
			    if(auth.isLoggedIn()){
			      $state.go('home');
			    }
			  }]
			});

		$urlRouterProvider.otherwise('home')
	}
]);
//controller for authentication. Uses the the auth service created below to register/log in users and send any error messages if there is one/redirect user to the home view once logged in.
app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth) {
		$scope.user = {};

		$scope.register = function(){
			auth.register($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		};

		$scope.logIn = function(){
	    auth.logIn($scope.user).error(function(error){
	      $scope.error = error;
	    }).then(function(){
	      $state.go('home');
	    });
	  };
	}
])
//navbar controller to easily tell if use is logged in or not by using the isLoggIn,  currentUser, and logOut methods from the auth factory
app.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth){
	  $scope.isLoggedIn = auth.isLoggedIn;
	  $scope.currentUser = auth.currentUser;
	  $scope.logOut = auth.logOut;
}]);

app.controller('MainCtrl', ['$scope', 'posts', 'auth',
	function($scope, posts, auth){
	$scope.test = 'Hello world';
	// any change or modification made to $scope.posts will be stored in the service and is immediately accessible by any other module that injects the 'posts' serice.
	$scope.posts = posts.posts;
  //only want to show the add post and add comment forms if the user is logged in. Use the auth service to check
	$scope.isLoggedIn = auth.isLoggedIn;
	//get username from auth
	$scope.username = auth.currentUser;
	// bind a function to the scope that pushed a new post to an array of posts on $scope when form is submitted
	$scope.addPost = function() {
		// dont allow user to submit empty title
	  if(!$scope.title || $scope.title === '') { return; }

	  posts.create({
	    title: $scope.title,
	    link: $scope.link,
	    author: $scope.username
	  });
	  $scope.title = '';
	  $scope.link = '';
	};
	// increment upvote by 1 on each click of thumbs up next to post
	$scope.incrementUpvotes = function(post) {
		// if ($scope.count <= 1) {
		//calling upvote function on posts service
			posts.upvote(post);
		// }
	}
	//downvote post by 1 on click of thumbs down next to post
	$scope.downVotePost = function(post) {
		//calling downvote function on posts service
		posts.downvote(post)
	}
 //  $scope.count =0;
	// $scope.clickCount = function() {
	// 	console.log('count')
		
	// 	var max_count = 1;

	// 	while ($scope.count <= max_count) {
	// 		$scope.count += 1;
	// 	}

	// }
		
		// if ($scope.count <= max_count) {
		//  	return true;
		//   } else { 
		//  	 	return false; 
		//  	 }
		// }; 
}])

//using a service for a posts object, this helps with code organization and lets you share code across an app by injecting the service. Injecting $http service for routing and the $auth service I created to send the JWT token to the server on authenticated requests. Have to pass the headers: {Authorization: 'Bearer '+auth.getToken()} object as the last argument for $http calls for the create, upvote, addComment, and upvoteComment since thouse routes require an auth token. 
app.factory('posts', ['$http', 'auth', function($http, auth){
	//storing posts in an object called o so you can more onto the object if needed in the future.
	var o = {
    posts: []
  };

 // retrieve posts using angulars' $http service to query posts route. The sucess funtion allows me to bind function that will be executed when the request return
  o.getAll = function() {
  	return $http.get('/posts').success(function(data){
  		// use the angular.copy() method to create a deep copy of the returned data. This ensures that the $scope.posts variable in MainCtrl will also be updated, ensuring the new values are reflect in our view.
  		angular.copy(data, o.posts)
  	})
  }
 //function to to add a new post to the db. Upon success post will be pushed to local posts array.
  o.create = function(post) {
	  return $http.post('/posts', post, 
	  	{ headers: {Authorization: 'Bearer '+auth.getToken()}
	  	}).success(function(data){
	    o.posts.push(data);
	  });
	};

	//function to retrieve single post from server. A promise is being used instead of success because resolve function is added to the Posts state. The angular ui-router will detect when we enter the posts state then will automatically query the server for the post object, including comments. The state will finish loading only when the request has returned.  To get access to the post object we retrieve though the PostCtrl, the object will be directly injected in the PostCtrl
	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(res){
			return res.data;
		})
	}

//function to call route to upvote a post in db. The local copy of the post is also being upvoted to reflect the changes upon success of db upvote.
	o.upvote = function(post) {
	  return $http.put('/posts/' + post._id + '/upvote', null, { headers: {Authorization: 'Bearer '+auth.getToken()}
	  	}).success(function(data){
	      post.upvotes += 1;
	    });
	};

//function to call route to downvote a post.
	o.downvote = function(post) {
	  return $http.put('/posts/' + post._id + '/downvote', null, { headers: {Authorization: 'Bearer '+auth.getToken()}
	  	}).success(function(data){
	      post.upvotes -= 1;
	    });
	};
//function to call route to add comment to post
	o.addComment = function(id, comment) {
  	return $http.post('/posts/' + id + '/comments', comment, { headers: {Authorization: 'Bearer '+auth.getToken()}
	  });
	};
//function to call route to upvote a posts' comment and on success upvote comment so db and posts service have same amount of upvotes
	o.upvoteComment = function(post, comment) {
 		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, 
 			{ 
 				headers: {
 					Authorization: 'Bearer '+auth.getToken()}
	  	})
 				.success(function (data) {
          comment.upvotes += 1;
        });
	};



  return o;
}])


//the single post object retrieved from the post state is injected into the PostsCtrl. Still injects posts to gain access to methods that manipulate the comments
app.controller('PostsCtrl', 
	['$scope', 
	'posts', 
	'post',
	'auth', function($scope, posts, post, auth){

		$scope.post = post;
		//only want to show the add post and add comment forms if the user is logged in. Use the auth service to check
		$scope.isLoggedIn = auth.isLoggedIn;

		//get username from auth service
		$scope.username = auth.currentUser

		$scope.addComment = function() {
			if($scope.body === '') { return; }
			// console.log($scope.body, post._id)
			posts.addComment(post._id, {
				body: $scope.body,
				author: $scope.username
			}).success(function(comment) {
				console.log(comment)
				 $scope.post.comments.push(comment);
			});

			$scope.body = '';
		}
   //call function to increment upvote of comment
		$scope.incrementUpvotes = function(comment) {
			if (posts.clickCount) {
				posts.upvoteComment(post, comment)	
			}
		}
}])


//auth factory. need to inject $http for interfacing with server and $window for interfacing with LocalStorage. LocalStorage will be used for persisting data to the client. If a JWT token exists in localStorage, we can assume the user is logged in as long as the token isn't expired. To log a user out, remove the token from localStorage.
app.factory('auth', 
	['$http', 
	'$window', 
	function($http, $window) {

	var auth = {}
	// set localstorage token
	auth.saveToken = function (token){
  	$window.localStorage['flapper-news-token'] = token;
	};

	// get localstorage token
	auth.getToken = function (){
  	return $window.localStorage['flapper-news-token'];
	}

	// return a boolean value for if the user is logged in.
	auth.isLoggedIn = function(){
	  var token = auth.getToken();

	  if(token){
	  	// The payload is the middle part of the token between the two .s. It's a JSON object that has been base64'd. We can get it back to a stringified JSON by using $window.atob(), and then back to a javascript object with JSON.parse
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload.exp > Date.now() / 1000;
	  } else {
	    return false;
	  }
	};
//function that returns the username of the user that's logged in by parsing the payload
	auth.currentUser = function(){
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload.username;
	  }
	};
//function that posts a user to the /register route and saves the token returned on success
	auth.register = function(user){
	  return $http.post('/register', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};
//login function that posts a user to the /login route and saves the token returned.
	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

//logout function that removes the user's token from localStorage, logging the user out.
	auth.logOut = function(){
	  $window.localStorage.removeItem('flapper-news-token');
	};

	return auth;

}]);
//service to make sure a logged in user only votes once per post
app.factory('voteCounter', 
	['posts', 
	'post', 
	function(post, posts) {

		var count = 0;
		const max_count = 1;

		var voteCounter = {};
		voteCounter.count = 0;

		voteCounter.checkCount = function() {

		}
}])



