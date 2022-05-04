var Joi = require('@hapi/joi');

function validateDate(value) {
  var schema = Joi.date().required();
  if (schema.validate(value).error) {
    return 'Date invalide';
  }
}

module.exports = validateDate;