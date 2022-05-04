var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var prestationCategorySchema = new Schema({
  name: String
});

module.exports = mongoose.model('PrestationCategory', prestationCategorySchema);