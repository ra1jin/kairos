var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var ProductCategory = require(appRoot + '/models/product-category.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /product-category-list
//
router.get('/product-category-list', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  var productCategories = await ProductCategory.find().exec();
  res.render('product-category/product-category-list', {
    productCategories: productCategories
  });
}]);

//
// GET /product-category-new
//
router.get('/product-category-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('product-category/product-category-new');
}]);

//
// GET /product-category-edit
//
router.get('/product-category-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'productCategoryId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/product-category-new');
  }

  var productCategory = await ProductCategory.findById(req.query.productCategoryId).exec();
  if (!productCategory) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    productCategory = Object.assign(productCategory, res.locals.flash.data);
  }

  res.render('product-category/product-category-edit', {
    productCategory: productCategory
  });
}]);

//
// POST /product-category-new
//
router.post('/product-category-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'name', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-category-new');
  }

  if (await ProductCategory.findOne({ name: req.body.name })) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cette catégorie existe déjà' });
    return res.redirect('/product-category-new');
  }

  try {
    var productCategory = new ProductCategory();
    productCategory.name = req.body.name;
    await productCategory.save();
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/product-category-list');
}]);

//
// POST /product-category-edit
//
router.post('/product-category-edit/', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'productCategoryId', validateObjectId)(req);
  requestValidator('body', 'name', validateString)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-category-edit?productCategoryId=' + req.body.productCategoryId);
  }

  var productCategory = await ProductCategory.findById(req.body.productCategoryId).exec();
  if (!productCategory) {
    return res.redirect('/product-category-new');
  }

  if (await ProductCategory.findOne({ name: req.body.name })) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cette catégorie existe déjà' });
    return res.redirect('/product-category-edit?productCategoryId=' + req.body.productCategoryId);
  }

  try {
    productCategory.name = req.body.name;
    await productCategory.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/product-category-list');
}]);

//
// POST /product-category-delete
//
router.post('/product-category-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'productCategoryId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-category-list');
  }

  var productCategory = await ProductCategory.findById(req.body.productCategoryId);
  if (!productCategory) {
    res.flash('alert', { type: 'error', message: 'La catégorie n\'existe pas' });
    return res.redirect('/product-category-list');
  }

  await productCategory.remove();
  res.flash('alert', { type: 'success', message: 'Catégorie supprimé' });
  return res.redirect('/product-category-list');
}]);

module.exports = router;