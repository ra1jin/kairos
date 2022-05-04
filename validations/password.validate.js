var Joi = require('@hapi/joi');

function validatePassword(value) {
  var schema = Joi.string().min(3).max(30).required();
  if (schema.validate(value).error) {
    return 'Format du mot de passe invalide';
  }
}

module.exports = validatePassword;