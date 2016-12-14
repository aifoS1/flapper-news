var mongoose = require('mongoose');

// In Mongoose, we can create relationships between different data models using the ObjectId type. The ObjectId data type refers to a 12 byte MongoDB ObjectId, which is actually what is stored in the database. The ref property tells Mongoose what type of object the ID references and enables us to retrieve both items simultaneously.
var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
  upvotes: {type: Number, default: 0},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});

CommentSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
}

mongoose.model('Comment', CommentSchema);