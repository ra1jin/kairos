var appRoot = require('app-root-path');
var nodemailer = require('nodemailer');

var config = require(appRoot + '/config');
var transporter = nodemailer.createTransport({
  host: config.get('mailer').host,
  port: config.get('mailer').port,
  secure: false,
  auth: {
    user: config.get('mailer').user,
    pass: config.get('mailer').pass
  }
});

module.exports.send = async function (emailDest, subject, message, messageHTML, cb = function() {}) {
  if (config.get('mailer').enable == false) {
    console.log('Mail not send because service is disable !');
    return;
  }

  return transporter.sendMail({
    from: '"natureellebeaute.fr" <contact@natureellebeaute.fr>',
    to: emailDest,
    subject: subject,
    text: message,
    html: messageHTML
  }, function (err, info) {
    if (err) throw new Error('SMS error during sending !');
    cb(err, info);
  });
}