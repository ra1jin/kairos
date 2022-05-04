var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var config = require(appRoot + '/config');
var mailService = require(appRoot + '/shared/mail.service.shared');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateFirstname = require(appRoot + '/validations/first-name.validate');
var validateLastname = require(appRoot + '/validations/last-name.validate');
var validateEmail = require(appRoot + '/validations/email.validate');
var validateString = require(appRoot + '/validations/string.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /contact
//
router.get('/contact', function (req, res) {
  res.render('contact');
});

//
// POST /contact
//
router.post('/contact', async function (req, res, next) {
  requestValidator('body', 'firstname', validateFirstname)(req);
  requestValidator('body', 'lastname', validateLastname)(req);
  requestValidator('body', 'email', validateEmail)(req);
  requestValidator('body', 'message', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/contact');
  }

  try {
    var emailDest = config.get('contactEmail');
    var subject = req.body.firstname + ' ' + req.body.lastname + ' vous à contacté ! (' + req.body.email + ')';
    var message = req.body.message;
    await mailService.send(emailDest, subject, message, '');
  } catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Message envoyé' });
  return res.redirect('/contact');
});

module.exports = router;