// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var nodemailer = require('nodemailer'),
  logger = require('./logger'),
  configuration = require('./configuration');

var Mailer = function () {
  // Read the mail settings from the config.json
  this.service = configuration.getConfig('smtpService');
  this.user = configuration.getConfig('smtpUsername');
  this.pass = configuration.getConfig('smtpPassword');
  this.from = configuration.getConfig('fromAddress');

  // Set a flag to check that required settings exist
  this.canSendMail = !!this.service && !!this.user && !!this.pass && !!this.from;

  // Configure the credentials for the specified sevice
  // See http://www.nodemailer.com/ for options
  this.transporter = nodemailer.createTransport({
    service: this.service,
    auth: {
      user: this.user,
      pass: this.pass
    }
  });
};

Mailer.prototype.send = function (toAddress, subject, text, callback) {
  var mailOptions = {
      from: this.from,
      to: toAddress,
      subject: subject,
      text: text
  };

  // Send mail with defined transport object
  if (this.canSendMail) {
    this.transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        logger.log('error', error);
        return callback(error);
      } else {
        logger.log('info', 'Message sent: ' + info.response);
        return callback(null);
      }
    });  
  } else {
    logger.log('info', 'Not configured to send e-mail');
    return callback(null);
  }
};

module.exports.Mailer = Mailer;