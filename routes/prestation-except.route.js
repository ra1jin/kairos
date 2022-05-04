var appRoot = require('app-root-path');
var Joi = require('@hapi/joi');
var express = require('express');
var router = express.Router();

var Prestation = require(appRoot + '/models/prestation.model');
var PrestationExcept = require(appRoot + '/models/prestation-except.model');
var User = require(appRoot + '/models/user.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateTime = require(appRoot + '/validations/time.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /prestation-except-list
//
router.get('/prestation-except-list', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  var prestationExcepts = await PrestationExcept.find().populate('user').populate('prestation').exec();
  res.render('prestation-except/prestation-except-list', {
    prestationExcepts: prestationExcepts
  });
}]);

//
// GET /prestation-except-new
//
router.get('/prestation-except-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('prestation-except/prestation-except-new', {
    users: await User.find().exec(),
    prestations: await Prestation.find().exec()
  });
}]);

//
// GET /prestation-except-edit
//
router.get('/prestation-except-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'prestationExceptId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/prestation-except-new');
  }

  var prestationExcept = await PrestationExcept.findById(req.query.prestationExceptId).exec();
  if (!prestationExcept) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    prestationExcept = Object.assign(prestationExcept, res.locals.flash.data);
  }

  res.render('prestation-except/prestation-except-edit', {
    prestationExcept: prestationExcept,
    users: await User.find().exec(),
    prestations: await Prestation.find().exec()
  });
}]);

//
// POST /prestation-except-new
//
router.post('/prestation-except-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'userId', validateString)(req);
  requestValidator('body', 'prestationId', validateString)(req);
  requestValidator('body', 'startTime', validateTime)(req);
  requestValidator('body', 'endTime', validateTime)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-except-new');
  }

  try {
    var prestationExcept = new PrestationExcept();
    prestationExcept.user = req.body.userId;
    prestationExcept.prestation = req.body.prestationId;
    prestationExcept.startTime = req.body.startTime;
    prestationExcept.endTime = req.body.endTime;
    await prestationExcept.save();
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/prestation-except-list');
}]);

//
// POST /prestation-except-edit
//
router.post('/prestation-except-edit/', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'userId', validateString)(req);
  requestValidator('body', 'prestationId', validateString)(req);
  requestValidator('body', 'startTime', validateTime)(req);
  requestValidator('body', 'endTime', validateTime)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-except-edit?prestationExceptId=' + req.body.prestationExceptId);
  }

  var prestationExcept = await PrestationExcept.findById(req.body.prestationExceptId).exec();
  if (!prestationExcept) {
    return res.redirect('/prestation-except-new');
  }

  try {
    prestationExcept.user = req.body.userId;
    prestationExcept.prestation = req.body.prestationId;
    prestationExcept.startTime = req.body.startTime;
    prestationExcept.endTime = req.body.endTime;
    await prestationExcept.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/prestation-except-list');
}]);

//
// POST /prestation-except-delete
//
router.post('/prestation-except-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'prestationExceptId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-except-list');
  }

  var prestationExcept = await PrestationExcept.findById(req.body.prestationExceptId);
  if (!prestationExcept) {
    res.flash('alert', { type: 'error', message: 'L\'exception n\'existe pas' });
    return res.redirect('/prestation-except-list');
  }

  await prestationExcept.remove();
  res.flash('alert', { type: 'success', message: 'Exception supprimé' });
  return res.redirect('/prestation-except-list');
}]);

module.exports = router;