var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var ProductBrand = require(appRoot + '/models/product-brand.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /product-brand-list
//
router.get('/product-brand-list', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  var productBrands = await ProductBrand.find().exec();
  res.render('product-brand/product-brand-list', {
    productBrands: productBrands
  });
}]);

//
// GET /product-brand-new
//
router.get('/product-brand-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('product-brand/product-brand-new');
}]);

//
// GET /product-brand-edit
//
router.get('/product-brand-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'productBrandId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/product-brand-new');
  }

  var productBrand = await ProductBrand.findById(req.query.productBrandId).exec();
  if (!productBrand) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    productBrand = Object.assign(productBrand, res.locals.flash.data);
  }

  res.render('product-brand/product-brand-edit', {
    productBrand: productBrand
  });
}]);

//
// POST /product-brand-new
//
router.post('/product-brand-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'name', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-brand-new');
  }

  if (await ProductBrand.findOne({ name: req.body.name })) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cette marque existe déjà' });
    return res.redirect('/product-brand-new');
  }

  try {
    var productBrand = new ProductBrand();
    productBrand.name = req.body.name;
    await productBrand.save();
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/product-brand-list');
}]);

//
// POST /product-brand-edit
//
router.post('/product-brand-edit/', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'productBrandId', validateObjectId)(req);
  requestValidator('body', 'name', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-brand-edit?productBrandId=' + req.body.productBrandId);
  }

  var productBrand = await ProductBrand.findById(req.body.productBrandId).exec();
  if (!productBrand) {
    return res.redirect('/product-brand-new');
  }

  if (await ProductBrand.findOne({ name: req.body.name })) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cette marque existe déjà' });
    return res.redirect('/product-brand-edit?productBrandId=' + req.body.productBrandId);
  }

  try {
    productBrand.name = req.body.name;
    await productBrand.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/product-brand-list');
}]);

//
// POST /product-brand-delete
//
router.post('/product-brand-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'productBrandId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-brand-list');
  }

  var productBrand = await ProductBrand.findById(req.body.productBrandId);
  if (!productBrand) {
    res.flash('alert', { type: 'error', message: 'La marque n\'existe pas' });
    return res.redirect('/product-brand-list');
  }

  await productBrand.remove();
  res.flash('alert', { type: 'success', message: 'Marque supprimé' });
  return res.redirect('/product-brand-list');
}]);

module.exports = router;