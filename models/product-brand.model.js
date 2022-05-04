var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productBrandSchema = new Schema({
  name: String
});

module.exports = mongoose.model('ProductBrand', productBrandSchema);