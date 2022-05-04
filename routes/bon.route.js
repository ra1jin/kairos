var express = require('express');
var router = express.Router();

// -----------------------------------------------------------------------------------------------------

router.get('/bon', function (req, res) {
  res.render('bon');
});

module.exports = router;