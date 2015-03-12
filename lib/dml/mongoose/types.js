// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
mongoose = require('mongoose');

module.exports = {
  "string":String,
  "number":Number,
  "boolean":Boolean,
  "date": Date,
  "objectid":mongoose.Schema.ObjectId,
  "object": Object 
};
