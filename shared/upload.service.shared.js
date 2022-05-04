var appRoot = require('app-root-path');
var multer = require('multer');

var config = require(appRoot + '/config');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.get('uploads.dest'))
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
});

module.exports = multer({ storage: storage });