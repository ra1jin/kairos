var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

//--------------------------------------------------------------------------------------------

var vacationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: {
    type: Date,
    required: true,
    get: toMoment
  },
  endTime: {
    type: Date,
    required: true,
    get: toMoment
  },
  created: {
    type: Date,
    default: Date.now,
    get: toMoment
  }
});

module.exports = mongoose.model('Vacation', vacationSchema);

// -----------------------------------------------------------------------------------------------------

function toMoment(timestamp) {
  return moment(new Date(timestamp));
}