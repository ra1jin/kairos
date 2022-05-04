var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var authGuard = require(appRoot + '/lib/express-auth-guard/express-auth-guard');

// -----------------------------------------------------------------------------------------------------

router.get('/dashboard', [authGuard([{ role: 'STAFF' }]), async function (req, res) {
  res.render('dashboard');
}]);

module.exports = router;