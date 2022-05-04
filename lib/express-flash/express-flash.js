var _ = require('lodash');

module.exports = async function (req, res, next) {
  if (req.session.flash !== undefined) {
    res.locals.flash = req.session.flash;
    req.session.flash = undefined;
  }

  res.flash = function(key, value) {
    req.session.flash = req.session.flash || {};
    req.session.flash[key] = value;
  }

  next();
}