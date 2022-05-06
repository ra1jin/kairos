var appRoot = require('app-root-path');
var express = require('express');
var moment = require('moment');
var router = express.Router();

var Reserve = require(appRoot + '/models/reserve.model');
var Prestation = require(appRoot + '/models/prestation.model');
var User = require(appRoot + '/models/user.model');
var calendarService = require(appRoot + '/shared/calendar.service.shared');
var prestationService = require(appRoot + '/shared/prestation.service.shared');
var smsService = require(appRoot + '/shared/sms.service.shared');
var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');
var requestValidator = require(appRoot + '/lib/express-request-validator/express-request-validator');
var validateFirstName = require(appRoot + '/validations/first-name.validate');
var validateLastName = require(appRoot + '/validations/last-name.validate');
var validatePhoneNumber = require(appRoot + '/validations/phone-number.validate');
var validateNumber = require(appRoot + '/validations/number.validate');
var validateDate = require(appRoot + '/validations/date.validate');
var validateString = require(appRoot + '/validations/string.validate');

// -----------------------------------------------------------------------------------------------------

//
// GET /reserve-list
//
router.get('/reserve-list', [authGuard([{ role: 'STAFF' }]), async function (req, res) {
  var beginDate = (req.query.beginDate) ? moment(req.query.beginDate, "YYYY-MM-DD") : moment();
  var endDate = (req.query.endDate) ? moment(req.query.endDate, "YYYY-MM-DD") : moment();
  var reserves = await Reserve.find({ startTime: { "$gte": moment(beginDate).startOf('day'), "$lte": moment(endDate).endOf('day') }, user: req.session.user }).sort({ startTime: 1 }).populate('prestations').exec();

  res.render('reserve/reserve-list', {
    beginDate: beginDate,
    endDate: endDate,
    reserves: reserves
  });
}]);

//
// POST /reserve-delete
//
router.post('/reserve-delete', [authGuard([{ role: 'STAFF' }]), async function (req, res, next) {
  var reserve = await Reserve.findById(req.body.reserveId);
  if (!reserve) {
    return next(new Error('reserveId not exist'));
  }

  if (reserve.user != req.session.user._id) {
    res.flash('alert', { type: 'error', message: 'Cette reservation ne vous appartient pas' });
    return res.redirect('/reserve-list?beginDate=' + reserve.startTime.format('YYYY-MM-DD'));
  }

  await reserve.remove();
  res.flash('alert', { type: 'success', message: 'Réservation supprimée' });
  return res.redirect('/reserve-list?beginDate=' + reserve.startTime.format('YYYY-MM-DD'));
}]);

//
// GET /reserve-start
//
router.get('/reserve-start', async function (req, res) {
  req.session.formReserve = {};
  req.session.formReserve.state = 1;
  return res.redirect('/reserve');
});

//
// GET /reserve-back
//
router.get('/reserve-back', async function (req, res) {
  if (req.session.formReserve && req.session.formReserve.state > 1) {
    req.session.formReserve.state--;
  }

  return res.redirect('/reserve');
});

//
// GET /reserve
//
router.get('/reserve', async function (req, res) {
  if (!req.session.formReserve) {
    req.session.formReserve = {};
    req.session.formReserve.state = 1;
  }

  //
  // -- State 01
  //
  if (req.session.formReserve.state == 1) {
    var catalog = {};
    var prestations = await Prestation.find().populate('category').exec();

    prestations.forEach(prestation => {
      var category = prestation.category.name;
      if (!catalog[category]) catalog[category] = [];
      catalog[category].push(prestation);
    });

    return res.render('reserve/reserve-1', {
      catalog: catalog,
      prestationIds: req.session.formReserve.prestationIds
    });
  }
  //
  // -- State 02
  //
  else if (req.session.formReserve.state == 2) {
    return res.render('reserve/reserve-2', {
      firstName: req.session.formReserve.firstName,
      lastName: req.session.formReserve.lastName,
      phoneNumber: req.session.formReserve.phoneNumber
    });
  }
  //
  // -- State 03
  //
  else if (req.session.formReserve.state == 3) {
    var minDate = moment();
    var maxDate = moment();
    if (req.session.user && req.session.user.roles.indexOf('STAFF') != -1) {
      minDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      maxDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(80, 'days');
    }
    else {
      minDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(1, 'days');
      maxDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(14, 'days');
    }

    if (!req.session.formReserve.date) {
      req.session.formReserve.date = minDate;
    }

    var calendar = await calendarService.getCalendar(minDate.format('YYYY-MM-DD'), maxDate.format('YYYY-MM-DD'), req.session.formReserve.prestationIds);
    return res.render('reserve/reserve-3', {
      minDate: minDate,
      maxDate: maxDate,
      users: await User.find({ collaborator: true }).exec(),
      userId: req.session.formReserve.userId,
      date: moment(req.session.formReserve.date),
      time: req.session.formReserve.time,
      calendar: calendar
    });
  }
  //
  // -- State 04
  //
  else if (req.session.formReserve.state == 4) {
    var duration = 0;
    var prestations = [];
    var user = await User.findById(req.session.formReserve.userId).exec();

    for(var prestationId of req.session.formReserve.prestationIds) {
      var prestation = await Prestation.findById(prestationId).exec();
      duration += prestation.duration * 60 * 1000;
      prestations.push(prestation);
    }

    return res.render('reserve/reserve-4', {
      firstName: req.session.formReserve.firstName,
      lastName: req.session.formReserve.lastName,
      phoneNumber: req.session.formReserve.phoneNumber,
      prestations: prestations,
      user: user,
      startTime: moment(req.session.formReserve.time),
      endTime: moment(req.session.formReserve.time + duration)
    });
  }
  //
  // -- State 05
  //
  else if (req.session.formReserve.state == 5) {
    req.session.formReserve = {};
    req.session.formReserve.state = 1;
    return res.render('reserve/reserve-5');
  }
  else {
    return res.redirect('/reserve');
  }
});

//
// POST /reserve
//
router.post('/reserve', async function (req, res, next) {
  if (!req.session.formReserve) {
    return res.redirect('/reserve');
  }

  //
  // -- State 01
  //
  if (req.session.formReserve.state == 1) {
    if (!req.body.prestationIds) {
      res.flash('alert', { type: 'error', message: 'Veuillez choisir un ou plusieurs soins' });
      return res.redirect('/reserve');
    }

    var prestationIds = typeof req.body.prestationIds == 'string' ? [req.body.prestationIds] : req.body.prestationIds;
    for (var prestationId of prestationIds) {
      var prestation = await Prestation.findById(prestationId).exec();
      if (!prestation) {
        res.flash('alert', { type: 'error', message: 'Ce soin n\'existe pas' });
        return res.redirect('/reserve');
      }  
    }

    req.session.formReserve.prestationIds = prestationIds;
    req.session.formReserve.state = 2;
    return res.redirect('/reserve');
  }
  //
  // -- State 02
  //
  else if (req.session.formReserve.state == 2) {
    requestValidator('body', 'firstName', validateFirstName)(req);
    requestValidator('body', 'lastName', validateLastName)(req);
    requestValidator('body', 'phoneNumber', validatePhoneNumber)(req);
    req.session.formReserve.firstName = req.body.firstName;
    req.session.formReserve.lastName = req.body.lastName;
    req.session.formReserve.phoneNumber = req.body.phoneNumber;

    if (req.validatorErrors) {
      res.flash('errors', req.validatorErrors);
      res.flash('alert', { type: 'error', message: 'Format des données invalides' });
      return res.redirect('/reserve');
    }

    req.session.formReserve.state = 3;
    return res.redirect('/reserve');
  }
  //
  // -- State 03
  //
  else if (req.session.formReserve.state == 3) {
    requestValidator('body', 'date', validateDate)(req);
    requestValidator('body', 'userId', validateString)(req);
    requestValidator('body', 'time', validateNumber)(req);
    req.session.formReserve.date = req.body.date;
    req.session.formReserve.userId = req.body.userId;
    req.session.formReserve.time = Number(req.body.time);

    if (req.validatorErrors) {
      res.flash('errors', req.validatorErrors);
      res.flash('alert', { type: 'error', message: 'Format des données invalides' });
      return res.redirect('/reserve');
    }

    var minDate = moment();
    var maxDate = moment();
    if (req.session.user && req.session.user.roles.indexOf('STAFF') != -1) {
      minDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      maxDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(30, 'days');
    }
    else {
      minDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(1, 'days');
      maxDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).add(14, 'days');
    }

    if (moment(req.session.formReserve.date) < minDate || moment(req.session.formReserve.date) > maxDate) {
      res.flash('alert', { type: 'error', message: 'Date hors des limites' });
      return res.redirect('/reserve');
    }

    var calendar = await calendarService.getCalendar(minDate.format('YYYY-MM-DD'), maxDate.format('YYYY-MM-DD'), req.session.formReserve.prestationIds);
    calendar[req.session.formReserve.date]['any'] = [];
    var availableUserIds = [];
    for (var userId in calendar[req.session.formReserve.date]) {
      if (calendar[req.session.formReserve.date][userId].indexOf(req.session.formReserve.time) != -1) {
        availableUserIds.push(userId);
      }
    }

    if (availableUserIds.length == 0) {
      res.flash('alert', { type: 'error', message: 'Aucune correspondance trouvé' });
      return res.redirect('/reserve');
    }

    if (req.session.formReserve.userId == 'any') {
      var userRandomIndex = Math.floor((Math.random() * 1000) % (availableUserIds.length));
      req.session.formReserve.userId = availableUserIds[userRandomIndex];
    }

    if (availableUserIds.indexOf(req.session.formReserve.userId) == -1) {
      res.flash('alert', { type: 'error', message: 'Créneau horaire incorrect' });
      return res.redirect('/reserve');
    }

    req.session.formReserve.state = 4;
    return res.redirect('/reserve');
  }
  //
  // -- State 04
  //
  else if (req.session.formReserve.state == 4) {
    try {
      var prestations = [];
      var duration = 0;

      for(var prestationId of req.session.formReserve.prestationIds) {
        var prestation = await Prestation.findById(prestationId).exec();
        duration += prestation.duration * 60 * 1000;
        prestations.push(prestation);
      }

      var duration = await prestationService.getPrestationsDuration(req.session.formReserve.prestationIds);
      var reserve = new Reserve();
      reserve.firstName = req.session.formReserve.firstName;
      reserve.lastName = req.session.formReserve.lastName;
      reserve.phoneNumber = req.session.formReserve.phoneNumber;
      reserve.prestations = prestations;
      reserve.user = req.session.formReserve.userId;
      reserve.startTime = new Date(req.session.formReserve.time);
      reserve.endTime = new Date(req.session.formReserve.time + duration);
      await reserve.save();

      var user = await User.findById(req.session.formReserve.userId).exec();
      var messageText = '';
      messageText += 'RENDEZ-VOUS PRIS\n';
      messageText += moment(req.session.formReserve.time).locale('fr').format('LLLL').toUpperCase() + '\n';
      messageText += req.session.formReserve.firstName + ' ' + req.session.formReserve.lastName + '\n';
      messageText += req.session.formReserve.phoneNumber;
      smsService.send(user.phoneNumber, messageText);
    } catch (err) {
      return next(err);
    }

    req.session.formReserve.state = 5;
    return res.redirect('/reserve');
  }
});

module.exports = router;
