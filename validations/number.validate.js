var Joi = require('@hapi/joi');

function validateNumber(value) {
  var schema = Joi.string().regex(/^[0-9]+$/).required();
  if (schema.validate(value).error) {
    return 'Valeur invalide';
  }
}

module.exports = validateNumber;