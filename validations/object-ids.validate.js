var Joi = require('@hapi/joi');
var validateObjectId = require('./object-id.validate');

function validateObjectIds(value) {
  if (typeof value == 'string') {
    return validateObjectId(value);
  }
  else if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      var errors = validateObjectId(value[i]);
      if (errors) return errors;
    }
  }
}

module.exports = validateObjectIds;