var appRoot = require('app-root-path');
var fs = require('fs');
var express = require('express');
var moment = require('moment');
var router = express.Router();
var Joi = require('@hapi/joi');

var config = require(appRoot + '/config');
var mailService = require(appRoot + '/shared/mail.service.shared');
var uploadService = require(appRoot + '/shared/upload.service.shared');
var Subscriber = require(appRoot + '/models/subscriber.model');
var Event = require(appRoot + '/models/event.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateDate = require(appRoot + '/validations/date.validate');
var validateLocation = require(appRoot + '/validations/location.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

var EVENT_DEFAULT_PICTURE = '/images/event-default.jpg';

// -----------------------------------------------------------------------------------------------------

//
// GET /event-list
//
router.get('/event-list', async function (req, res) {
  var events = await Event.find({}).sort({ startDatetime: 1 }).exec();
  events = events.filter(function (event) {
    return moment(event.endDatetime) >= moment();
  });

  res.render('event/event-list', {
    numEvents: events.length,
    events: events
  });
});

//
// GET /event-edit
//
router.get('/event-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'eventId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/event-new');
  }

  var event = await Event.findById(req.query.eventId).exec();
  if (!event) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    event = Object.assign(event, res.locals.flash.data);
  }

  res.render('event/event-edit', {
    event: event
  });
}]);

//
// GET /event-new
//
router.get('/event-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('event/event-new');
}]);

//
// POST /event-new
//
router.post('/event-new', [authGuard([{ role: 'ADMIN' }]), uploadService.single('picture'), async function (req, res, next) {
  requestValidator('body', 'title', validateString)(req);
  requestValidator('body', 'startDatetime', validateDate)(req);
  requestValidator('body', 'endDatetime', validateDate)(req);
  requestValidator('body', 'location', validateLocation)(req);
  requestValidator('body', 'description', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/event-new');
  }

  var schema = Joi.date().min(new Date()).required();
  if (schema.validate(req.body.startDatetime).error) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Date de début invalide' });
    return res.redirect('/event-new');
  }

  var schema = Joi.date().min(new Date(req.body.startDatetime)).required();
  if (schema.validate(req.body.endDatetime).error) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Date de fin invalide' });
    return res.redirect('/event-new');
  }

  try {
    var event = new Event();
    event.title = req.body.title;
    event.startDatetime = req.body.startDatetime;
    event.endDatetime = req.body.endDatetime;
    event.location = req.body.location;
    event.description = req.body.description;
    event.picture = (req.file) ? req.file.path.slice(6, req.file.path.length).replace(/\\/gi, '/') : EVENT_DEFAULT_PICTURE;
    await event.save();

    var subscribers = await Subscriber.find({}).exec();
    for (let subscriber of subscribers) {
      var emailDest = subscriber.email;
      var subject = event.title;
      var message = 'Nous vous informons d\'un nouvel évènement.\n';
      message += 'Pour en savoir plus rendez-vous sur : ' + config.get('url') + '/event-list \n';
      message += 'Coordialement.';
      await mailService.send(emailDest, subject, message, '');
    }
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/event-list');
}]);

//
// POST /event-edit
//
router.post('/event-edit/', [authGuard([{ role: 'ADMIN' }]), uploadService.single('picture'), async function (req, res, next) {
  requestValidator('body', 'eventId', validateObjectId)(req);
  requestValidator('body', 'title', validateString)(req);
  requestValidator('body', 'startDatetime', validateDate)(req);
  requestValidator('body', 'endDatetime', validateDate)(req);
  requestValidator('body', 'location', validateLocation)(req);
  requestValidator('body', 'description', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/event-edit?eventId=' + req.body.eventId);
  }

  var schema = Joi.date().min(new Date()).required();
  if (schema.validate(req.body.startDatetime).error) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Date de début invalide' });
    return res.redirect('/event-edit?eventId=' + req.body.eventId);
  }

  var schema = Joi.date().min(new Date(req.body.startDatetime)).required();
  if (schema.validate(req.body.endDatetime).error) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Date de fin invalide' });
    return res.redirect('/event-edit?eventId=' + req.body.eventId);
  }

  var event = await Event.findById(req.body.eventId).exec();
  if (!event) {
    return res.redirect('/event-new');
  }

  if (req.file && event.picture != EVENT_DEFAULT_PICTURE) {
    fs.unlinkSync('public' + event.picture);
  }

  try {
    event.title = req.body.title;
    event.startDatetime = req.body.startDatetime;
    event.endDatetime = req.body.endDatetime;
    event.location = req.body.location;
    event.description = req.body.description;
    event.picture = (req.file) ? req.file.path.slice(6, req.file.path.length).replace(/\\/gi, '/') : event.picture;
    await event.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/event-list');
}]);

//
// POST /event-delete
//
router.post('/event-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'eventId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/event-list');
  }

  var event = await Event.findById(req.body.eventId);
  if (!event) {
    res.flash('alert', { type: 'error', message: 'L\'évènement n\'existe pas' });
    return res.redirect('/event-list');
  }

  if (event.picture != EVENT_DEFAULT_PICTURE) {
    fs.unlinkSync('public' + event.picture);
  }

  await event.remove();
  res.flash('alert', { type: 'success', message: 'Evènement supprimé' });
  return res.redirect('/event-list');
}]);

module.exports = router;
