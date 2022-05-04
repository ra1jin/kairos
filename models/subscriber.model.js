var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//--------------------------------------------------------------------------------------------

var subscriberSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true
  }
});

//
// HOOKS
//

module.exports = mongoose.model('Subscriber', subscriberSchema);
