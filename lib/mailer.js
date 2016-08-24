// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var configuration = require('./configuration'),
    EmailTemplate = require('email-templates').EmailTemplate,
    nodemailer = require('nodemailer'),
    logger = require('./logger'),
    path = require('path');


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

Mailer.prototype.send = function (toAddress, subject, text, templateData, callback) {
  if(!this.canSendMail) {
    logger.log('info', 'Not configured to send e-mail');
    return callback();
  }

  var app = require('./application')();

  var mailOptions = {
      from: this.from,
      to: toAddress,
      subject: subject,
      logoText: app.polyglot.t('app.emaillogotext'),
      greeting: app.polyglot.t('app.greeting'),
      footer: app.polyglot.t('app.emailfooter'),
      text: text,
      templateData: templateData
  };

  configure(mailOptions, _.bind(function(error, options) {
    // Send mail with defined transport object
    this.transporter.sendMail(options, function(error, info){
      if (error) {
        logger.log('error', error);
        return callback(error);
      } else {
        logger.log('info', 'Message sent: ' + info.response);
        callback();
      }
    });
  }, this));
};

var configure = function (options, callback) {
  if(options.templateData !== null) {
    var template = new EmailTemplate(path.join(__dirname, 'templates', options.templateData.name));
    template.render(options, function (error, results) {
      if (error) {
        logger.log('error', error);
        return callback(error);
      }
      options.html = results.html;
      options.text = results.text;
      callback(null, options)
    })
  } else {
    callback(null, options);
  }
};

module.exports.Mailer = Mailer;