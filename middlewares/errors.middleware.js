var appRoot = require('app-root-path');
var config = require(appRoot + '/config');

module.exports = function (err, req, res, next) {
  console.log(err);
  res.locals.error = (config.get('env') === 'development') ? err : {};
  res.status(err.status || 500);
  res.render('error-view');
}