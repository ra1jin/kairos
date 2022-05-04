var appRoot = require('app-root-path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var Enums = require(appRoot + '/models/enums');

//--------------------------------------------------------------------------------------------

var eventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDatetime: {
    type: Date,
    required: true,
    get: toMoment
  },
  endDatetime: {
    type: Date,
    required: true,
    get: toMoment
  },
  location: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: {
    type: String
  },
  picture: {
    type: String,
    default: 'images/event-default.jpg'
  },
  code: {
    type: String,
    default: generateCode()
  },
  created: {
    type: Date,
    default: Date.now,
    get: toMoment
  }
});

//
// CUSTOM REPOSITORY METHODS
//
eventSchema.methods.getState = function () {
  var today = moment();
  var start = this.startDatetime;
  var end = this.endDatetime;

  if (start > today) {
    return Enums.EventStates.ON_COMING;
  }
  else if (start < today && end > today) {
    return Enums.EventStates.ON_GOING;
  }
  else {
    return Enums.EventStates.ENDED;
  }
};

eventSchema.methods.getTimeRemaining = function () {
  var today = moment();
  var diffSeconds = this.startDatetime.diff(today) / 1000;

  return {
    days: Math.floor(((diffSeconds / 60) / 60) / 24),
    hours: Math.floor(((diffSeconds / 60) / 60) % 24),
    minutes: Math.floor((diffSeconds / 60) % 60),
    seconds: Math.floor((diffSeconds % 60))
  }
}

//
// CUSTOM REPOSITORY STATICS
//

module.exports = mongoose.model('Event', eventSchema);

// -----------------------------------------------------------------------------------------------------

function toMoment(timestamp) {
  return moment(new Date(timestamp));
}

function generateCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}