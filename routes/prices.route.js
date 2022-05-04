var appRoot = require('app-root-path');
var express = require('express');
var router = express.Router();

var Prestation = require(appRoot + '/models/prestation.model');

// -----------------------------------------------------------------------------------------------------

router.get('/prices', async function (req, res) {
  var catalog = {};
  var prestations = await Prestation.find().populate('category').exec();

  prestations.forEach(prestation => {
    var category = prestation.category.name;
    if (!catalog[category]) catalog[category] = [];
    catalog[category].push(prestation);
  });

  res.render('prices', {
    catalog: catalog
  });
});

module.exports = router;