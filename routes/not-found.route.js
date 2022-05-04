var express = require('express');
var router = express.Router();

// -----------------------------------------------------------------------------------------------------

router.get('/not-found', function (req, res) {
  res.status(404);
  res.render('not-found');
});

router.use(function (req, res, next) {
  res.redirect('/not-found');
});

module.exports = router;