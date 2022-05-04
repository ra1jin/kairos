var Joi = require('@hapi/joi');

function validateLastName(value) {
  var schema = Joi.string().regex(/^\D{2,30}$/).required();
  if (schema.validate(value).error) {
    return 'Votre nom semble invalide'
  }
}

module.exports = validateLastName;