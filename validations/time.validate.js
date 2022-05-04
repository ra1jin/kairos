var Joi = require('@hapi/joi');

function validateTime(value) {
  var schema = Joi.string().regex(/^([0-9]{2})\:([0-9]{2})$/).required()
  if (schema.validate(value).error) {
    return 'Heure invalide';
  }
}

module.exports = validateTime;