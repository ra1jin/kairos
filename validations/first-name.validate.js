var Joi = require('@hapi/joi');

function validateFirstName(value) {
  var schema = Joi.string().regex(/^\D{2,30}$/).required();
  if (schema.validate(value).error) {
    return 'Votre prenom semble invalide'
  }
}

module.exports = validateFirstName;