var appRoot = require('app-root-path');
var moment = require('moment');

var Reserve = require(appRoot + '/models/reserve.model');
var User = require(appRoot + '/models/user.model');
var Vacation = require(appRoot + '/models/vacation.model');
var PrestationExcept = require(appRoot + '/models/prestation-except.model');
var prestationService = require(appRoot + '/shared/prestation.service.shared');

var SLOT_DELAY_MS = 15 * 60 * 1000;

// -----------------------------------------------------------------------------------------------------

module.exports.getCalendar = async function (dateStringBegin, dateStringEnd, prestationIds) {
  var calendar = {};
  var userIds = await User.find({ collaborator: true }).distinct('_id').exec();

  for (var date = moment(dateStringBegin); date.format('YYYY-MM-DD') != dateStringEnd; date = date.add(1, 'days')) {
    var dateId = date.format('YYYY-MM-DD');
    calendar[dateId] = {};
    calendar[dateId]['any'] = [];
    for (var userId of userIds) {
      calendar[dateId][userId] = await getUserFreeSlots(dateId, userId, prestationIds);
      for (slot of calendar[dateId][userId]) {
        if (calendar[dateId]['any'].indexOf(slot) == -1) {
          calendar[dateId]['any'].push(slot);
        }
      }
    }

    calendar[dateId]['any'] = calendar[dateId]['any'].sort();
  }

  return calendar;
}

async function getUserFreeSlots(dateString, userId, prestationIds) {
  var res = [];
  var date = moment(dateString);
  if (!date) return [];

  var user = await User.findById(userId).exec();
  if (!user) return [];
  if (!user.collaborator) return [];
  if (!user.collaboratorAvailable) return [];

  var day = user.collaboratorSchedules[date.day()];
  if (!day) return [];
  if (day.length == 0) return [];
  if (day.length % 2 != 0) return [];

  var vacations = await Vacation.find({ user: userId });
  var reserves = await Reserve.find({
    startTime: { '$gte': moment(date).startOf('day'), '$lte': moment(date).endOf('day') },
    user: userId
  }).exec();

  var prestationExcepts = [];
  for (let prestationId of prestationIds) {
    prestationExcepts.push(...await PrestationExcept.find({ user: userId, prestation: prestationId }));
  }

  var duration = await prestationService.getPrestationsDuration(prestationIds);

  for (var i = 0; i < day.length; i += 2) {
    var slots = [];
    var begin = day[i].split(':');
    var end = day[i + 1].split(':');

    if (begin.length != 2 || end.length != 2) continue;

    var beginDate = moment(date).set({ hour: begin[0], minute: begin[1] }).valueOf();
    var endDate = moment(date).set({ hour: end[0], minute: end[1] }).valueOf();

    // populate slots
    for (var t = beginDate; t <= endDate; t += SLOT_DELAY_MS) {
      slots.push(t);
    }

    // filter exception rule
    slots = slots.filter(function (a) {
      var b = a + duration;
      for (let prestationExcept of prestationExcepts) {
        var startExcept = prestationExcept.startTime.split(':');
        var endExcept = prestationExcept.endTime.split(':');
        var startExceptDate = moment(date).set({ hour: startExcept[0], minute: startExcept[1] }).valueOf();
        var endExceptDate = moment(date).set({ hour: endExcept[0], minute: endExcept[1] }).valueOf();
        if (a < endExceptDate && b > startExceptDate) return false;
      }

      return true;
    });

    // filter vacation rule
    slots = slots.filter(function (a) {
      var b = a + duration;
      for (let vacation of vacations) {
        var startVacationDate = moment(vacation.startTime);
        var endVacationDate = moment(vacation.endTime);
        if (a < endVacationDate && b > startVacationDate) return false;
      }

      return true;
    });

    // filter intersection rule
    slots = slots.filter(function (a) {
      var b = a + duration;
      for (var reserve of reserves) {
        if (a < reserve.endTime && b > reserve.startTime) return false;
      }

      return true;
    });

    // filter shift rule
    slots = slots.filter(function (a) {
      var b = a + duration;
      return (b > endDate) ? false : true;
    });

    res = res.concat(slots);
  }

  return res;
}