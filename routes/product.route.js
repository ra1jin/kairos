var appRoot = require('app-root-path');
var fs = require('fs');
var express = require('express');
var router = express.Router();

var Product = require(appRoot + '/models/product.model');
var ProductBrand = require(appRoot + '/models/product-brand.model');
var ProductCategory = require(appRoot + '/models/product-category.model');
var uploadService = require(appRoot + '/shared/upload.service.shared');
var mongooseSlugify = require(appRoot + '/lib/mongoose-slugify/mongoose-slugify');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');
var validateNumeric = require(appRoot + '/validations/numeric.validate');

var PRODUCT_DEFAULT_PICTURE = '/images/product-default.jpg';

// -----------------------------------------------------------------------------------------------------

//
// GET /product-list
//
router.get('/product-list', async function (req, res) {
  var request = Product.find({}).populate('brand');
  var limit = req.query.limit || 3;
  var page = req.query.page || 1;

  if (req.query.category) request.where('category', req.query.category);
  if (req.query.brand) request.where('brand', req.query.brand);
  if (req.query.minPrice) request.where('price').gte(req.query.minPrice);
  if (req.query.maxPrice) request.where('price').lte(req.query.maxPrice);
  
  var products = await request.exec();
  var numProducts = products.length;
  var begin = (page - 1) * limit;
  var end = begin + limit;

  res.render('product/product-list', {
    query: req.query,
    currentPage: page,
    numPages: Math.ceil(numProducts / limit),
    products: products.slice(begin, end),
    productCategories: await ProductCategory.find({}).exec(),
    productBrands: await ProductBrand.find({}).exec(),
  });
});

//
// GET /product-view
//
router.get('/product-view', async function (req, res) {
  requestValidator('query', 'productId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/product-list');
  }

  var product = await Product.findById(req.query.productId).populate('brand').exec();
  if (!product) {
    return res.render('not-found');
  }

  res.render('product/product-view', {
    product: product
  });
});

//
// GET /product-new
//
router.get('/product-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('product/product-new', {
    productBrands: await ProductBrand.find({}).exec(),
    productCategories: await ProductCategory.find({}).exec()
  });
}]);

//
// GET /product-edit
//
router.get('/product-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'productId', validateObjectId)(req);

  if (req.validatorErrors) {
    return res.redirect('/product-new');
  }

  var product = await Product.findById(req.query.productId).exec();
  if (!product) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    product = Object.assign(product, res.locals.flash.data);
  }

  res.render('product/product-edit', {
    productBrands: await ProductBrand.find({}).exec(),
    productCategories: await ProductCategory.find({}).exec(),
    product: product
  });
}]);

//
// POST /product-new
//
router.post('/product-new', [authGuard([{ role: 'ADMIN' }]), uploadService.single('picture'), async function (req, res, next) {
  requestValidator('body', 'title', validateString)(req);
  requestValidator('body', 'subtitle', validateString)(req);
  requestValidator('body', 'description', validateString)(req);
  requestValidator('body', 'brand', validateObjectId)(req);
  requestValidator('body', 'category', validateObjectId)(req);
  requestValidator('body', 'price', validateNumeric)(req);

  if (req.validatorErrors) {
    console.log(req.validatorErrors);
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-new');
  }

  try {
    var product = new Product();
    product.slug = await mongooseSlugify('Product', { title: req.body.title });
    product.title = req.body.title;
    product.subtitle = req.body.subtitle;
    product.description = req.body.description;
    product.picture = (req.file) ? req.file.path.slice(6, req.file.path.length).replace(/\\/gi, '/') : PRODUCT_DEFAULT_PICTURE;
    product.brand = req.body.brand;
    product.category = req.body.category;
    product.published = req.body.published == 'on' ? true : false;
    product.available = req.body.available == 'on' ? true : false;
    product.price = req.body.price;
    await product.save();
  }
  catch (err) {
    return next(err);
  }

  res.redirect('/product-list');
}]);

//
// POST /product-edit
//
router.post('/product-edit/', [authGuard([{ role: 'ADMIN' }]), uploadService.single('picture'), async function (req, res, next) {
  requestValidator('body', 'productId', validateObjectId)(req);
  requestValidator('body', 'title', validateString)(req);
  requestValidator('body', 'subtitle', validateString)(req);
  requestValidator('body', 'description', validateString)(req);
  requestValidator('body', 'brand', validateObjectId)(req);
  requestValidator('body', 'category', validateObjectId)(req);
  requestValidator('body', 'price', validateNumeric)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-edit?productId=' + req.body.productId);
  }

  var product = await Product.findById(req.body.productId).exec();
  if (!product) {
    return res.redirect('/product-new');
  }

  if (req.file && product.picture != PRODUCT_DEFAULT_PICTURE) {
    fs.unlinkSync('public' + product.picture);
  }

  try {
    product.slug = await mongooseSlugify('Product', { title: req.body.title });
    product.title = req.body.title;
    product.subtitle = req.body.subtitle;
    product.description = req.body.description;
    product.picture = (req.file) ? req.file.path.slice(6, req.file.path.length).replace(/\\/gi, '/') : product.picture;
    product.brand = req.body.brand;
    product.category = req.body.category;
    product.published = req.body.published == 'on' ? true : false;
    product.available = req.body.available == 'on' ? true : false;
    product.price = req.body.price;
    await product.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/product-list');
}]);

//
// POST /product-delete
//
router.post('/product-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'productId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/product-list');
  }

  var product = await Product.findById(req.body.productId);
  if (!product) {
    res.flash('alert', { type: 'error', message: 'Le produit n\'existe pas' });
    return res.redirect('/product-list');
  }

  if (product.picture != PRODUCT_DEFAULT_PICTURE) {
    fs.unlinkSync('public' + product.picture);
  }

  await product.remove();
  res.flash('alert', { type: 'success', message: 'Produit supprimé' });
  return res.redirect('/product-list');
}]);

module.exports = router;
