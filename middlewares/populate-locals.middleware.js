var appRoot = require('app-root-path');
var config = require(appRoot + '/config');

// -----------------------------------------------------------------------------------------------------
module.exports = function (req, res, next) {
  res.locals._currentUser = req.session.user;
  res.locals._currentUrl = req.url;
  res.locals._config = config;
  next();
}