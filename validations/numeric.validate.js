var Joi = require('@hapi/joi');

function validateNumeric(value) {
  var schema = Joi.number().required();
  if (schema.validate(value).error) {
    return 'Valeur invalide';
  }
}

module.exports = validateNumeric;