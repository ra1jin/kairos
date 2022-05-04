var appRoot = require('app-root-path');

var Prestation = require(appRoot + '/models/prestation.model');

// -----------------------------------------------------------------------------------------------------

module.exports.getPrestationsDuration = async function (prestationIds) {
  var duration = 0;
  for (var prestationId of prestationIds) {
    var prestation = await Prestation.findById(prestationId).exec();
    duration += prestation.duration * 60 * 1000;
  }

  return duration;
};