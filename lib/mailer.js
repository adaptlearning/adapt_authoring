// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var configuration = require('./configuration'),
    EmailTemplate = require('email-templates').EmailTemplate,
    nodemailer = require('nodemailer'),
    helpers = require('./helpers'),
    logger = require('./logger'),
    path = require('path');

var Mailer = function () {
  // Read the mail settings from the config.json
  this.isEnabled = configuration.getConfig('useSmtp');
  this.connectionUrl = configuration.getConfig('smtpConnectionUrl');
  this.service = configuration.getConfig('smtpService');
  this.user = configuration.getConfig('smtpUsername');
  this.pass = configuration.getConfig('smtpPassword');
  this.from = configuration.getConfig('fromAddress');

  // check that required settings exist
  this.validateSettings = function() {
    var errors = [];
    if(!this.connectionUrl) {
      if(this.service === '') errors.push('smtpService');
      if(this.user === '') errors.push('smtpUsername');
      if(this.pass === '') errors.push('smtpPassword');
      if(this.from === '') errors.push('fromAddress');

      if(errors.length > 0) {
        throw new Error('Mailer requires the following settings to function: ' + errors.toString());
      }
    }
  };

  createTransport(this);
};

Mailer.prototype.send = function (toAddress, subject, text, templateData, callback) {
  logger.log('info', 'Mailer.send: to: ' + toAddress + ' (' + this.from + '), ' + subject + ', ' + text);
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

  // Send mail with defined transport object
  if (this.isEnabled) {
    try {
      this.validateSettings();
    } catch(e) {
      return logger.log('warn', e);
    }
    configure(mailOptions, _.bind(function(error, options) {
      if(error) {
        return callback(error);
      }
      // Send mail with defined transport object
      this.transport.sendMail(options, function(error, info){
        if (error) {
          return callback(error);
        } else {
          logger.log('info', 'Message sent: ' + info.response);
          callback();
        }
      });
    }, this));
  }
};

/**
* Configure the credentials for the specified sevice
* using either the connectionUrl or the other settings
* See http://www.nodemailer.com/ for options
*/
var createTransport = function(mailerInstance) {
  var options = mailerInstance.connectionUrl ?
    mailerInstance.connectionUrl :
    {
      service: mailerInstance.service,
      auth: {
        user: mailerInstance.user,
        pass: mailerInstance.pass
      }
  };
  mailerInstance.transport = nodemailer.createTransport(options);
};

var configure = function (options, callback) {
  // TODO localise these errors
  if(!helpers.isValidEmail(options.to)) {
    return callback(new Error("Can't send email to '" + options.to + "': not a valid email address"));
  }
  if(!helpers.isValidEmail(options.from)) {
    return callback(new Error("Can't send email from '" + options.from + "': not a valid email address"));
  }
  if(options.templateData !== null) {
    var template = new EmailTemplate(path.join(__dirname, 'templates', options.templateData.name));
    template.render(options, function (error, results) {
      if (error) {
        return callback(error);
      }
      options.html = results.html;
      options.text = results.text;
      callback(null, options);
    });
  } else {
    callback(null, options);
  }
};

module.exports.Mailer = Mailer;
