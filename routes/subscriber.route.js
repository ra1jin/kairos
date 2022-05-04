var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var Subscriber = require(appRoot + '/models/subscriber.model');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateEmail = require(appRoot + '/validations/email.validate');

// -----------------------------------------------------------------------------------------------------

//
// POST /subscribe
//
router.post('/subscribe', async function (req, res) {
  requestValidator('body', 'email', validateEmail)(req);

  var subscriberFound = await Subscriber.findOne({ email: req.body.email });
  if (subscriberFound) {
    return res.redirect('/event-list');
  }

  var subscriber = new Subscriber();
  subscriber.email = req.body.email;
  await subscriber.save();

  return res.render('subscriber/subscribe-success');
});

module.exports = router;