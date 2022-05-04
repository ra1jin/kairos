var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var flash = require(appRoot + '/lib/express-flash/express-flash');
var populateLocals = require(appRoot + '/middlewares/populate-locals.middleware');
var errors = require(appRoot + '/middlewares/errors.middleware');
var eventRoute = require(appRoot + '/routes/event.route');
var homeRoute = require(appRoot + '/routes/home.route');
var pricesRoute = require(appRoot + '/routes/prices.route');
var productRoute = require(appRoot + '/routes/product.route');
var productBrandRoute = require(appRoot + '/routes/product-brand.route');
var productCategoryRoute = require(appRoot + '/routes/product-category.route');
var reserveRoute = require(appRoot + '/routes/reserve.route');
var subscriberRoute = require(appRoot + '/routes/subscriber.route');
var bonRoute = require(appRoot + '/routes/bon.route');
var contactRoute = require(appRoot + '/routes/contact.route');
var dashboardRoute = require(appRoot + '/routes/dashboard.route');
var notFoundRoute = require(appRoot + '/routes/not-found.route');
var healthCheckRoute = require(appRoot + '/routes/health-check.route');
var authRoute = require(appRoot + '/routes/auth.route');
var userRoute = require(appRoot + '/routes/user.route');
var prestationRoute = require(appRoot + '/routes/prestation.route');
var prestationCategoryRoute = require(appRoot + '/routes/prestation-category.route');
var prestationExceptRoute = require(appRoot + '/routes/prestation-except.route');
var vacationRoute = require(appRoot + '/routes/vacation.route');

// -----------------------------------------------------------------------------------------------------

// Middlewares begin
router.use(populateLocals);
router.use(flash);

// Routes
router.use(eventRoute);
router.use(homeRoute);
router.use(pricesRoute);
router.use(productRoute);
router.use(productBrandRoute);
router.use(productCategoryRoute);
router.use(reserveRoute);
router.use(subscriberRoute);
router.use(bonRoute);
router.use(contactRoute);
router.use(dashboardRoute);
router.use(authRoute);
router.use(userRoute);
router.use(prestationRoute);
router.use(prestationCategoryRoute);
router.use(prestationExceptRoute);
router.use(vacationRoute);
router.use(healthCheckRoute);
router.use(notFoundRoute);

// Middlewares end
router.use(errors);

module.exports = router;