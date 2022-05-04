var Joi = require('@hapi/joi');

function validateUsername(value, req) {
  var schema = Joi.string().alphanum().min(2).max(30).required();
  if (schema.validate(value).error) {
    return req.translate('ERROR_INVALID_USERNAME_FORMAT');
  }
}

module.exports = validateUsername;