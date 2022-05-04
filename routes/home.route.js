var appRoot = require('app-root-path');
var express = require('express');
var moment = require('moment');
var router = express.Router();

var Event = require(appRoot + '/models/event.model');

// -----------------------------------------------------------------------------------------------------

router.get('/', async function (req, res) {
  var events = await Event.find({}).sort({ startDatetime: 1 }).exec();
  events = events.filter(function (event) {
    return moment(event.startDatetime) >= moment();
  });

  res.render('home', {
    events: events
  });
});

module.exports = router;