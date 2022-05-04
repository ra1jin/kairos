var Joi = require('@hapi/joi');

function validateEmail(value) {
  var schema = Joi.string().email().required();
  if (schema.validate(value).error) {
    return 'Adresse email non valide';
  }
}

module.exports = validateEmail;