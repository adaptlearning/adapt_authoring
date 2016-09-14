// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var nodemailer = require('nodemailer'),
  logger = require('./logger'),
  configuration = require('./configuration');

var Mailer = function () {

  // Read the mail settings from the config.json
  this.isEnabled = configuration.getConfig('useSmtp');
  this.service = configuration.getConfig('smtpService');
  this.user = configuration.getConfig('smtpUsername');
  this.pass = configuration.getConfig('smtpPassword');
  this.from = configuration.getConfig('fromAddress');

  // check that required settings exist
  this.validateSettings = function() {
    var errors = [];

    if(this.service === '') errors.push('smtpService');
    if(this.user === '') errors.push('smtpUsername');
    if(this.pass === '') errors.push('smtpPassword');
    if(this.from === '') errors.push('fromAddress');

    if(errors.length > 0) {
      throw new Error('Mailer requires the following settings to function: ' + errors.toString());
    }
  };

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
  if (this.isEnabled) {
    try {
      this.validateSettings();
    } catch(e) {
      logger.log('warn', e);
    }
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