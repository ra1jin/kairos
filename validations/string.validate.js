var Joi = require('@hapi/joi');

function validateString(value) {
  var schema = Joi.string().required();
  if (schema.validate(value).error) {
    return 'Ceci n\'est pas une chaine'
  }
}

module.exports = validateString;