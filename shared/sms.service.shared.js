var appRoot = require('app-root-path');
var ovh = require('ovh');

var config = require(appRoot + '/config');
var ovhAPI = ovh({
  endpoint: config.get('sms').endPoint,
  appKey: config.get('sms').key,
  appSecret: config.get('sms').secret,
  consumerKey: config.get('sms').consumer
});

module.exports.send = async function (phoneNumber, message, cb = function() {}) {
  if (config.get('sms').enable == false) {
    console.log('SMS not send because service is disable !');
    return;
  }

  return ovhAPI.request('POST', '/sms/' + config.get('sms').account + '/jobs', {
    message: message,
    senderForResponse: true,
    receivers: [phoneNumber]
  }, function(err, res) {
    cb(err, res);
  });
}