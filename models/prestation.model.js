var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//--------------------------------------------------------------------------------------------
var prestationSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: String,
    default: 'N/A'
  },
  type: {
    type: Schema.Types.ObjectId,
    ref: 'PrestationType'
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'PrestationCategory'
  },
  reservable: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('Prestation', prestationSchema);