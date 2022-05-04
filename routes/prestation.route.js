var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var Prestation = require(appRoot + '/models/prestation.model');
var PrestationCategory = require(appRoot + '/models/prestation-category.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateNumber = require(appRoot + '/validations/number.validate');
var validatePrice = require(appRoot + '/validations/price.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /prestation-list
//
router.get('/prestation-list', async function (req, res) {
  res.render('prestation/prestation-list', {
    prestations: await Prestation.find({}).exec()
  });
});

//
// GET /prestation-edit
//
router.get('/prestation-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'prestationId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/prestation-new');
  }

  var prestation = await Prestation.findById(req.query.prestationId).exec();
  if (!prestation) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    prestation = Object.assign(prestation, res.locals.flash.data);
  }

  res.render('prestation/prestation-edit', {
    prestation: prestation,
    prestationCategories: await PrestationCategory.find({}).exec()
  });
}]);

//
// GET /prestation-new
//
router.get('/prestation-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('prestation/prestation-new', {
    prestationCategories: await PrestationCategory.find({}).exec()
  });
}]);

//
// POST /prestation-new
//
router.post('/prestation-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'name', validateString)(req);
  requestValidator('body', 'description', validateString)(req);
  requestValidator('body', 'duration', validateNumber)(req);
  requestValidator('body', 'price', validatePrice)(req);
  requestValidator('body', 'category', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-new');
  }

  try {
    var prestation = new Prestation();
    prestation.name = req.body.name;
    prestation.description = req.body.description;
    prestation.duration = req.body.duration;
    prestation.price = req.body.price;
    prestation.category = req.body.category;
    prestation.reservable = req.body.reservable == 'on' ? true : false;
    await prestation.save();
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/prestation-list');
}]);

//
// POST /prestation-edit
//
router.post('/prestation-edit/', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'prestationId', validateObjectId)(req);
  requestValidator('body', 'name', validateString)(req);
  requestValidator('body', 'description', validateString)(req);
  requestValidator('body', 'duration', validateNumber)(req);
  requestValidator('body', 'price', validatePrice)(req);
  requestValidator('body', 'category', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-edit?prestationId=' + req.body.prestationId);
  }

  var prestation = await Prestation.findById(req.body.prestationId).exec();
  if (!prestation) {
    return res.redirect('/prestation-new');
  }

  try {
    prestation.name = req.body.name;
    prestation.description = req.body.description;
    prestation.duration = req.body.duration;
    prestation.price = req.body.price;
    prestation.category = req.body.category;
    prestation.reservable = req.body.reservable == 'on' ? true : false;
    await prestation.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/prestation-list');
}]);

//
// POST /prestation-delete
//
router.post('/prestation-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'prestationId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-list');
  }

  var prestation = await Prestation.findById(req.body.prestationId);
  if (!prestation) {
    res.flash('alert', { type: 'error', message: 'La prestation n\'existe pas' });
    return res.redirect('/prestation-list');
  }

  await prestation.remove();
  res.flash('alert', { type: 'success', message: 'Prestation supprimé' });
  return res.redirect('/prestation-list');
}]);

module.exports = router;
