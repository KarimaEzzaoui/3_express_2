const mongoose = require('mongoose');

// Define the Book schema
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
});

// Create the Book model
const Book = mongoose.model('Book', bookSchema);

// Export the Book model
module.exports = Book;
