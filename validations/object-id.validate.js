var Joi = require('@hapi/joi');

function validateObjectId(value) {
  var schema = Joi.string().regex(/^[a-f\d]{24}$/i).required();
  if (schema.validate(value).error) {
    return 'La valeur est invalide';
  }
}

module.exports = validateObjectId;