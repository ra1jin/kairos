var express = require('express');
var router = express.Router();

// -----------------------------------------------------------------------------------------------------

router.get('/health-check', function (req, res) {
  res.send('OK');
});

module.exports = router;