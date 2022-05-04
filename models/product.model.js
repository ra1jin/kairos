var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//--------------------------------------------------------------------------------------------

var productSchema = new Schema({
  slug: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  picture: {
    type: String,
    default: ''
  },
  brand: {
    type: Schema.Types.ObjectId,
    ref: 'ProductBrand'
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory'
  },
  published: {
    type:Boolean,
    default: true
  },
  available: {
    type:Boolean,
    default: true
  },
  price: {
    type: Number,
    required: true
  },
  closeups: [{
    type: String,
    default: ''
  }]
});

module.exports = mongoose.model('Product', productSchema);