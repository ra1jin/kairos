var Joi = require('@hapi/joi');

function validateLocation(value) {
  var schema = Joi.string().regex(/^https:\/\/goo.gl\/maps\/[A-Za-z0-9]{17}$/).required();
  if (schema.validate(value).error) {
    return 'Localisation invalide'
  }
}

module.exports = validateLocation;