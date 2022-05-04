var appRoot = require('app-root-path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var Enums = require(appRoot + '/models/enums');

//--------------------------------------------------------------------------------------------

var userSchema = new Schema({
  username: {
    type: String,
    required: 'Please fill in a username',
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    default: '00000000000000',
    trim: true
  },
  email: {
    type: String,
    unique: 'Email already exists',
    lowercase: true,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  roles: {
    type: [{
      type: String,
      enum: Object.values(Enums.Roles)
    }],
    default: ['MEMBER']
  },
  token: {
    type: String
  },
  activated: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date,
    default: Date.now,
    get: toMoment
  },
  resetPasswordExpire: {
    type: Number
  },
  collaborator: {
    type: Boolean,
    default: false
  },
  collaboratorAvailable: {
    type: Boolean,
    default: false
  },
  collaboratorSchedules: []
});

//
// HOOKS
//
userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    let password = this.get('password');
    this.set('password', encryptPassword(password));
  }

  next();
});

//
// CUSTOM REPOSITORY METHODS
//
userSchema.methods.toJSON = function () {
  var obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.methods.setPassword = function (password) {
  this.password = encryptPassword(password);
};

userSchema.methods.validPassword = function (password) {
  return matchPassword(this.password, password);
};

userSchema.methods.hasRole = function (role) {
  return this.roles.indexOf(role) !== -1;
};

userSchema.methods.generateToken = function() {
  this.token = crypto.randomBytes(128).toString('hex');
}

//
// CUSTOM REPOSITORY STATICS
//

module.exports = mongoose.model('User', userSchema);

// -----------------------------------------------------------------------------------------------------

function encryptPassword(password) {
  return bcrypt.hashSync(password, 8);
}

function matchPassword(encryptedPassword, givenPassword) {
  return bcrypt.compareSync(givenPassword, encryptedPassword);
}

function toMoment(timestamp) {
  return moment(new Date(timestamp));
}