var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

//--------------------------------------------------------------------------------------------
var reserveSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  prestations: [{
    type: Schema.Types.ObjectId,
    ref: 'Prestation'
  }],
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
  }
});

module.exports = mongoose.model('Reserve', reserveSchema);

function toMoment(timestamp) {
  return moment(new Date(timestamp));
}