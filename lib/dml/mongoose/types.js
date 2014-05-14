mongoose = require('mongoose');

module.exports = {
  "string":String,
  "number":Number,
  "boolean":Boolean,
  "date": Date,
  "objectid":mongoose.Schema.ObjectId
};
