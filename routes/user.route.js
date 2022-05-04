var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var User = require(appRoot + '/models/user.model');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateString = require(appRoot + '/validations/string.validate');
var validateFirstName = require(appRoot + '/validations/first-name.validate');
var validateLastName = require(appRoot + '/validations/last-name.validate');
var validateEmail = require(appRoot + '/validations/email.validate');
var validatePhonenumber = require(appRoot + '/validations/phone-number.validate');
var validatePassword = require(appRoot + '/validations/password.validate');
var validateObjectId = require(appRoot + '/validations/object-id.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /user-list
//
router.get('/user-list', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  var users = await User.find().exec();
  res.render('user/user-list', {
    users: users
  });
}]);

//
// GET /user-new
//
router.get('/user-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  res.render('user/user-new');
}]);

//
// GET /user-edit
//
router.get('/user-edit', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('query', 'userId', validateObjectId)(req);
  if (req.validatorErrors) {
    return res.redirect('/user-new');
  }

  var user = await User.findById(req.query.userId).exec();
  if (!user) {
    return res.render('not-found');
  }

  if (res.locals.flash && res.locals.flash.data) {
    user = Object.assign(user, res.locals.flash.data);
  }

  res.render('user/user-edit', {
    user: user
  });
}]);

//
// POST /user-new
//
router.post('/user-new', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'username', validateString)(req);
  requestValidator('body', 'firstName', validateFirstName)(req);
  requestValidator('body', 'lastName', validateLastName)(req);
  requestValidator('body', 'phoneNumber', validatePhonenumber)(req);
  requestValidator('body', 'email', validateEmail)(req);
  requestValidator('body', 'password', validatePassword)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/user-new');
  }

  if (await User.findOne({ email: req.body.email })) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cet email existe déjà' });
    return res.redirect('/user-new');
  }

  if (req.body.password != req.body.passwordConfirm) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Mots de passe différents' });
    return res.redirect('/user-new');
  }

  try {
    var user = new User();
    user.username = req.body.username;
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.phoneNumber = req.body.phoneNumber;
    user.email = req.body.email;
    user.password = req.body.password;
    user.roles = req.body.roles;
    user.activated = req.body.activated == 'on' ? true : false;
    user.collaborator = req.body.collaborator == 'on' ? true : false;
    user.collaboratorAvailable = req.body.collaboratorAvailable == 'on' ? true : false;
    user.collaboratorSchedules = [];

    for (var i = 0; i < 7; i++) {
      user.collaboratorSchedules.push([
        req.body['day-' + i + '-0'],
        req.body['day-' + i + '-1'],
        req.body['day-' + i + '-2'],
        req.body['day-' + i + '-3']
      ]);
    }

    await user.save();

    if (!user.activated) {
      user.generateToken();
      var emailDest = user.email;
      var subject = 'Confirmation d\'inscription';
      var message = 'Afin de confirmer votre inscription sur le site ' + config.get('url') + '.\n';
      message += 'Veuillez cliquer sur le lien suivant : ' + config.get('url') + '/activate?email=' + user.email + '&token=' + user.token + '\n';
      message += 'Coordialement, votre esthéticienne.';
      await mailService.send(emailDest, subject, message, '');
    }
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Création réussie' });
  res.redirect('/user-list');
}]);

//
// POST /user-edit
//
router.post('/user-edit/', [authGuard([{ role: 'ADMIN' }]), async function (req, res, next) {
  requestValidator('body', 'userId', validateObjectId)(req);
  requestValidator('body', 'username', validateString)(req);
  requestValidator('body', 'firstName', validateFirstName)(req);
  requestValidator('body', 'lastName', validateLastName)(req);
  requestValidator('body', 'phoneNumber', validatePhonenumber)(req);

  if (req.validatorErrors) {
    console.log(req.validatorErrors);
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/user-edit?userId=' + req.body.userId);
  }

  var user = await User.findById(req.body.userId).exec();
  if (!user) {
    return res.redirect('/user-new');
  }

  try {
    user.username = req.body.username;
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.phoneNumber = req.body.phoneNumber;
    user.roles = req.body.roles;
    user.activated = req.body.activated == 'on' ? true : false;
    user.collaborator = req.body.collaborator == 'on' ? true : false;
    user.collaboratorAvailable = req.body.collaboratorAvailable == 'on' ? true : false;
    user.collaboratorSchedules = [];

    for (var i = 0; i < 7; i++) {
      user.collaboratorSchedules.push([
        req.body['day-' + i + '-0'],
        req.body['day-' + i + '-1'],
        req.body['day-' + i + '-2'],
        req.body['day-' + i + '-3']
      ]);
    }

    await user.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Edition réussie' });
  res.redirect('/user-list');
}]);

//
// POST /user-delete
//
router.post('/user-delete', [authGuard([{ role: 'ADMIN' }]), async function (req, res) {
  requestValidator('body', 'userId', validateObjectId)(req);

  if (req.validatorErrors) {
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/user-list');
  }

  var user = await User.findById(req.body.userId);
  if (!user) {
    res.flash('alert', { type: 'error', message: 'L\'utilisateur n\'existe pas' });
    return res.redirect('/user-list');
  }

  await user.remove();
  res.flash('alert', { type: 'success', message: 'Utilisateur supprimé' });
  return res.redirect('/user-list');
}]);

module.exports = router;