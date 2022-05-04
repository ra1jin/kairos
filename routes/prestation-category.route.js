var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var PrestationCategory = require(appRoot + '/models/prestation-category.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /prestation-category-list
//
router.get('/prestation-category-list', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  var prestationCategories = await PrestationCategory.find().exec();
  res.render('prestation-category/prestation-category-list', {
    prestationCategories: prestationCategories
  });
}]);

//
// GET /prestation-category-new
//
router.get('/prestation-category-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('prestation-category/prestation-category-new');
}]);

//
// GET /prestation-category-edit
//
router.get('/prestation-category-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'prestationCategoryId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/prestation-category-new');
  }

  var prestationCategory = await PrestationCategory.findById(req.query.prestationCategoryId).exec();
  if (!prestationCategory) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    prestationCategory = Object.assign(prestationCategory, res.locals.flash.data);
  }

  res.render('prestation-category/prestation-category-edit', {
    prestationCategory: prestationCategory
  });
}]);

//
// POST /prestation-category-new
//
router.post('/prestation-category-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'name', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-category-new');
  }

  if (await PrestationCategory.findOne({ name: req.body.name })) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cette catégorie existe déjà' });
    return res.redirect('/prestation-category-new');
  }

  try {
    var prestationCategory = new PrestationCategory();
    prestationCategory.name = req.body.name;
    await prestationCategory.save();
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/prestation-category-list');
}]);

//
// POST /prestation-category-edit
//
router.post('/prestation-category-edit/', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'prestationCategoryId', validateObjectId)(req);
  requestValidator('body', 'name', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/prestation-category-edit?prestationCategoryId=' + req.body.prestationCategoryId);
  }

  var prestationCategory = await PrestationCategory.findById(req.body.prestationCategoryId).exec();
  if (!prestationCategory) {
    return res.redirect('/prestation-category-new');
  }

  if (await PrestationCategory.findOne({ name: req.body.name })) {
    console.log('ok');
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cette catégorie existe déjà' });
    return res.redirect('/prestation-category-edit?prestationCategoryId=' + req.body.prestationCategoryId);
  }

  try {
    prestationCategory.name = req.body.name;
    await prestationCategory.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/prestation-category-list');
}]);

//
// POST /prestation-category-delete
//
router.post('/prestation-category-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'prestationCategoryId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/event-list');
  }

  var prestationCategory = await PrestationCategory.findById(req.body.prestationCategoryId);
  if (!prestationCategory) {
    res.flash('alert', { type: 'error', message: 'La catégorie n\'existe pas' });
    return res.redirect('/prestation-category-list');
  }

  await prestationCategory.remove();
  res.flash('alert', { type: 'success', message: 'Catégorie supprimé' });
  return res.redirect('/prestation-category-list');
}]);

module.exports = router;