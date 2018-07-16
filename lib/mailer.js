// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
const configuration = require('./configuration');
const EmailTemplate = require('email-templates');
const nodemailer = require('nodemailer');
const helpers = require('./helpers');
const logger = require('./logger');
const path = require('path');

const Mailer = function () {
  // Read the mail settings from the config.json
  this.isEnabled = configuration.getConfig('useSmtp');
  this.useSmtpConnectionUrl = configuration.getConfig('useSmtpConnectionUrl');

  this.service = configuration.getConfig('smtpService');
  this.user = configuration.getConfig('smtpUsername');
  this.pass = configuration.getConfig('smtpPassword');
  this.from = configuration.getConfig('fromAddress');
  this.connectionUrl = configuration.getConfig('smtpConnectionUrl');

  // check that required settings exist
  this.validateSettings = function() {
    const errors = [];

    // validate based on selected connection
    if (this.useSmtpConnectionUrl === true) {
      if (this.connectionUrl === '') errors.push('smtpConnectionUrl');
    } else {
      if (this.service === '') errors.push('smtpService');
      if (this.user === '') errors.push('smtpUsername');
      if (this.pass === '') errors.push('smtpPassword');
    }

    // generic configuration options 
    if (this.from === '') errors.push('fromAddress');

    if (errors.length > 0) {
      throw new Error('Mailer requires the following settings to function: ' + errors.toString());
    }
  };

  // Configure the credentials for the specified sevice
  // See http://www.nodemailer.com/ for options

  let smtpConfig;

  if (this.useSmtpConnectionUrl) {
    smtpConfig = this.connectionUrl;
  } else {
    smtpConfig = {
      service: this.service,
      auth: {
        user: this.user,
        pass: this.pass
      }
    };
  }
  this.transporter = nodemailer.createTransport(smtpConfig);
};

Mailer.prototype.send = function (toAddress, subject, text, templateData, callback) {
  const app = require('./application')();

  const mailOptions = {
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
      logger.log('warn', e);
      return callback(e);
    }
    configure(mailOptions, _.bind(function(error, options) {
      if (error) {
        return callback(error);
      }
      // Send mail with defined transport object
      this.transporter.sendMail(options, function(error, info){
        if (error) {
          return callback(error);
        } else {
          logger.log('info', 'Message sent: ' + info.response);
          callback();
        }
      });
    }, this));
  } else {
    callback();
  }
};

const configure = function (options, callback) {
  // TODO localise these errors
  if (!helpers.isValidEmail(options.to)) {
    return callback(new Error("Can't send email, '" + options.to + "' is not a valid email address"));
  }
  if (!helpers.isValidEmail(options.from)) {
    return callback(new Error("Can't send email, '" + options.from + "' is not a valid email address"));
  }
  if (options.templateData !== null) {
    const template = new EmailTemplate({
      views: {
        root: path.resolve(__dirname, 'templates'),
        options: {
          extension: 'hbs',
        }
      },
      juice: true,
      juiceResources: {
        webResources: {
          relativeTo: path.resolve(__dirname, 'templates', options.templateData.name, '..')
        }
      }
    });
    template.render(options.templateData.name, options).then(function(result) {
      options.html = result;
      return callback(null, options);
    }).catch(function(reason) {
      return callback(reason);
    });
  } else {
    callback(null, options);
  }
};

module.exports.Mailer = Mailer;
