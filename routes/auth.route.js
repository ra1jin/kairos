var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var User = require(appRoot + '/models/user.model');
var config = require(appRoot + '/config');
var mailService = require(appRoot + '/shared/mail.service.shared');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateFirstName = require(appRoot + '/validations/first-name.validate');
var validateLastName = require(appRoot + '/validations/last-name.validate');
var validateEmail = require(appRoot + '/validations/email.validate');
var validatePassword = require(appRoot + '/validations/password.validate');
var validateToken = require(appRoot + '/validations/token.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /signin
//
router.get('/signin', function (req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }
  else {
    return res.render('auth/signin');
  }
});

//
// GET /signup
//
router.get('/signup', function (req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }

  res.render('auth/signup');
});

//
// GET /forgot-password
//
router.get('/forgot-password', function (req, res) {
  res.render('auth/forgot-password');
});

//
// GET /reset-password
//
router.get('/reset-password', function (req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }

  requestValidator('query', 'token', validateToken)(req);
  if (req.validatorErrors) {
    return res.redirect('/');
  }

  res.render('auth/reset-password', {
    token: req.query.token
  });
});

//
// GET /logout
//
router.get('/logout', function (req, res) {
  req.session.user = null;
  res.redirect('/');
});

//
// GET /activate
//
router.get('/activate', async function (req, res, next) {
  requestValidator('query', 'token', validateToken)(req);
  requestValidator('query', 'email', validateEmail)(req);

  if (req.validatorErrors) {
    return res.redirect('/');
  }

  var user = await User.findOne({ token: req.query.token });
  if (!user) {
    return res.redirect('/');
  }

  if (req.query.token != user.token) {
    return res.redirect('/');
  }

  try {
    user.activated = true;
    await user.save();
  }
  catch (err) {
    return next(err);
  }

  return res.redirect('/signin');
});

//
// POST /signin
//
router.post('/signin', async function (req, res) {
  if (req.session.user) {
    return res.redirect('/');
  }

  requestValidator('body', 'email', validateEmail)(req);
  requestValidator('body', 'password', validatePassword)(req);
  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/signin');
  }

  var user = await User.findOne({ email: req.body.email, activated: true });
  if (!user) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Echec de connexion' });
    return res.redirect('/signin');
  }

  var passwordIsValid = user.validPassword(req.body.password);
  if (!passwordIsValid) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Echec de connexion' });
    return res.redirect('/signin');
  }

  req.session.user = user;
  res.redirect('/');
});

//
// POST /signup
//
router.post('/signup', async function (req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }

  requestValidator('body', 'firstName', validateFirstName)(req);
  requestValidator('body', 'lastName', validateLastName)(req);
  requestValidator('body', 'email', validateEmail)(req);
  requestValidator('body', 'password', validatePassword)(req);

  if (req.validatorErrors) {
    res.flash('data', req.body);
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/signup');
  }

  if (await User.findOne({ email: req.body.email })) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Cet email existe déjà' });
    return res.redirect('/signup');
  }

  if (req.body.password != req.body.passwordConfirm) {
    res.flash('data', req.body);
    res.flash('alert', { type: 'error', message: 'Mots de passe différents' });
    return res.redirect('/signup');
  }

  try {
    var user = new User();
    user.username = req.body.firstName + ' ' + req.body.lastName;
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.password = req.body.password;
    user.generateToken();
    await user.save();

    var emailDest = user.email;
    var subject = 'Confirmation d\'inscription';
    var message = 'Afin de confirmer votre inscription sur le site ' + config.get('url') + '.\n';
    message += 'Veuillez cliquer sur le lien suivant : ' + config.get('url') + '/activate?email=' + user.email + '&token=' + user.token + '\n';
    message += 'Coordialement, votre esthéticienne.';
    await mailService.send(emailDest, subject, message, '');
  }
  catch (err) {
    return next(err);
  }

  return res.render('auth/signup-success');
});

//
// POST /forgot-password
//
router.post('/forgot-password', async function (req, res, next) {
  requestValidator('body', 'email', validateEmail)(req);
  if (req.validatorErrors) {
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/forgot-password');
  }

  var user = await User.findOne({ email: req.body.email, activated: true });
  if (!user) {
    res.flash('alert', { type: 'error', message: 'Ce compte n\'existe pas' });
    return res.redirect('/forgot-password');
  }

  try {
    user.resetPasswordExpires = Date.now() + 86400000;
    user.generateToken();
    await user.save();

    var emailDest = user.email;
    var subject = 'Réinitialisation de votre mot de passe';
    var message = 'Afin de réinitialiser votre mot de passe sur le site ' + config.get('url') + '.\n';
    message += 'Veuillez cliquer sur le lien suivant : ' + config.get('url') + '/reset-password?token=' + user.token + '\n';
    message += 'Coordialement, votre esthéticienne.';
    await mailService.send(emailDest, subject, message, '');
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Un email de changement du mot de passe a été envoyer' });
  return res.redirect('/forgot-password');
});

//
// POST /reset-password
//
router.post('/reset-password', async function (req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }

  requestValidator('body', 'token', validateToken)(req);
  requestValidator('body', 'password', validatePassword)(req);

  if (req.validatorErrors) {
    res.flash('errors', req.validatorErrors);
    res.flash('alert', { type: 'error', message: 'Format des données invalide' });
    return res.redirect('/reset-password');
  }

  var user = await User.findOne({ token: req.body.token });
  if (!user) {
    res.flash('alert', { type: 'error', message: 'Token invalide' });
    return res.redirect('/reset-password');
  }

  if (user.resetPasswordExpires < Date.now()) {
    res.flash('alert', { type: 'error', message: 'Demande de ré-initialisation du mot de passe expirée' });
    return res.redirect('/reset-password');
  }

  if (req.body.password != req.body.passwordConfirm) {
    res.flash('alert', { type: 'error', message: 'Mots de passe différent' });
    return res.redirect('/reset-password');
  }

  try {
    user.password = req.body.password;
    user.resetPasswordExpires = 0;
    user.token = '';
    await user.save();
  }
  catch (err) {
    return next(err);
  }

  res.flash('alert', { type: 'success', message: 'Changement du mot de passe effectué' });
  return res.redirect('/reset-password');
});

module.exports = router;

// -----------------------------------------------------------------------------------------------------