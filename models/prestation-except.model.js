var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var prestationExceptSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  prestation: {
    type: Schema.Types.ObjectId,
    ref: 'Prestation'
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('PrestationExcept', prestationExceptSchema);