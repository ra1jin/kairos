module.exports = function (type, field, validate) {
  return function (req) {
    var value = req[type][field];
    var message = validate(value, req);

    if (message) {
      if (req.validatorErrors === undefined) {
        req.validatorErrors = {}
      }

      req.validatorErrors[field] = {
        value: value,
        message: message,
        field: field
      };
    }
  }
}