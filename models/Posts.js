var mongoose = require('mongoose');
//postschema defines model Post with several attributes corresponding to the type of data we want to store. Comments is set to an array of comment references. This allows Mongoose's built in populate() method to easily retrieve all comments associated with a given post.
var PostSchema = new mongoose.Schema({
	title: String,
	link: String,
	author: String,
	upvotes: {type: Number, default: 0},
	comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}]
});

//model method to upvote a post by incrementing by 1
PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};
//model method to downvote a post by subtracting by 1
PostSchema.methods.downvote = function(cb) {
  this.upvotes -= 1;
  this.save(cb);
};
//define a model post with the postschema
mongoose.model('Post', PostSchema);