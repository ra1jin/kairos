var Joi = require('@hapi/joi');

function validatePrice(value) {
  var schema = Joi.string().regex(/^\d+(,\d{1,2})?$/).required();
  if (value && schema.validate(value).error) {
    return 'Valeur invalide';
  }
}

module.exports = validatePrice;