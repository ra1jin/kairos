var appRoot = require('app-root-path');
var Joi = require('@hapi/joi');
var express = require('express');
var router = express.Router();

var Vacation = require(appRoot + '/models/vacation.model');
var User = require(appRoot + '/models/user.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateDate = require(appRoot + '/validations/date.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /vacation-list
//
router.get('/vacation-list', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  var vacations = await Vacation.find().populate('user').exec();
  res.render('vacation/vacation-list', {
    vacations: vacations
  });
}]);

//
// GET /vacation-new
//
router.get('/vacation-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('vacation/vacation-new', {
    users: await User.find().exec()
  });
}]);

//
// GET /vacation-edit
//
router.get('/vacation-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'vacationId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/vacation-new');
  }

  var vacation = await Vacation.findById(req.query.vacationId).exec();
  if (!vacation) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    vacation = Object.assign(vacation, res.locals.flash.data);
  }

  res.render('vacation/vacation-edit', {
    vacation: vacation,
    users: await User.find().exec()
  });
}]);

//
// POST /vacation-new
//
router.post('/vacation-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'userId', validateString)(req);
  requestValidator('body', 'startTime', validateDate)(req);
  requestValidator('body', 'endTime', validateDate)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/vacation-new');
  }

  var schema = Joi.date().min(new Date(req.body.startTime)).required();
  if (schema.validate(req.body.endTime).error) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Date de fin invalide' });
    return res.redirect('/vacation-new');
  }

  try {
    var vacation = new Vacation();
    vacation.user = req.body.userId;
    vacation.startTime = req.body.startTime;
    vacation.endTime = req.body.endTime;
    await vacation.save();
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/vacation-list');
}]);

//
// POST /vacation-edit
//
router.post('/vacation-edit/', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'vacationId', validateObjectId)(req);
  requestValidator('body', 'userId', validateString)(req);
  requestValidator('body', 'startTime', validateDate)(req);
  requestValidator('body', 'endTime', validateDate)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/vacation-edit?vacationId=' + req.body.vacationId);
  }

  var schema = Joi.date().min(new Date(req.body.startTime)).required();
  if (schema.validate(req.body.endTime).error) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Date de fin invalide' });
    return res.redirect('/vacation-edit?vacationId=' + req.body.vacationId);
  }

  var vacation = await Vacation.findById(req.body.vacationId).exec();
  if (!vacation) {
    return res.redirect('/vacation-new');
  }

  try {
    vacation.user = req.body.userId;
    vacation.startTime = req.body.startTime;
    vacation.endTime = req.body.endTime;
    await vacation.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/vacation-list');
}]);

//
// POST /vacation-delete
//
router.post('/vacation-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'vacationId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/vacation-list');
  }

  var vacation = await Vacation.findById(req.body.vacationId);
  if (!vacation) {
    res.flash('alert', { type: 'error', message: 'La période de congès n\'existe pas' });
    return res.redirect('/vacation-list');
  }

  await vacation.remove();
  res.flash('alert', { type: 'success', message: 'Période de congès supprimé' });
  return res.redirect('/vacation-list');
}]);

module.exports = router;