var Joi = require('@hapi/joi');

function validateResetPasswordToken(value, req) {
  var schema = Joi.string().min(128).hex().required();
  if (schema.validate(value).error) {
    return 'Jeton d\'identification invalide'
  }
}

module.exports = validateResetPasswordToken;