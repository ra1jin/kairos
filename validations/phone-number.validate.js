var Joi = require('@hapi/joi');

function validatePhoneNumber(value) {
  var schema = Joi.string().regex(/^(\d{2}){5}$/);
  if (value && schema.validate(value).error) {
    return 'Votre numéro de téléphone semble invalide';
  }
}

module.exports = validatePhoneNumber;