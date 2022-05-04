var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var productCategorySchema = new Schema({
  name: String
});

module.exports = mongoose.model('ProductCategory', productCategorySchema);