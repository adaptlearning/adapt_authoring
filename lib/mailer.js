// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
const configuration = require('./configuration');
const EmailTemplate = require('email-templates');
const nodemailer = require('nodemailer');
const helpers = require('./helpers');
const logger = require('./logger');
const path = require('path');

const CONFIG_SETTINGS = [
  'useSmtp',
  'useSmtpConnectionUrl',
  'smtpService',
  'smtpUsername',
  'smtpPassword',
  'fromAddress',
  'smtpConnectionUrl'
];
const HTML_TEMPLATES_ROOT = path.resolve(__dirname, 'templates');

/**
* Private
*/

// returns formatted settings for nodemailer.createTransport
const getTransporterSettings = function(settings) {
  if(settings.useSmtpConnectionUrl) {
    return settings.smtpConnectionUrl;
  }
  return {
    service: settings.smtpService,
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword
    }
  };
};

// check that required settings exist
const validateSettings = function(settings) {
  const errors = [
    settings.useSmtpConnectionUrl && !settings.smtpConnectionUrl && 'smtpConnectionUrl',
    !settings.useSmtpConnectionUrl && !settings.smtpService && 'smtpService',
    !settings.useSmtpConnectionUrl && !settings.smtpUsername && 'smtpUsername',
    !settings.useSmtpConnectionUrl && !settings.smtpPassword && 'smtpPassword',
    !settings.fromAddress && 'fromAddress'
  ].filter(Boolean);
  if (errors.length) {
    throw new Error(`Mailer requires the following settings to function: ${errors.toString()}`);
  }
};

const configure = function(options, callback) {
  if (!helpers.isValidEmail(options.to)) {
    return callback(new Error(`Can't send email to ${options.to}, not a valid email address`));
  }
  if (!helpers.isValidEmail(options.from)) {
    return callback(new Error(`Can't send email from ${options.fromAddress}, not a valid email address`));
  }
  if (!options.templateData || Object.keys(options.templateData).length === 0) {
    return callback(null, options);
  }
  const template = new EmailTemplate({
    views: {
      root: HTML_TEMPLATES_ROOT,
      options: { extension: 'hbs' }
    },
    juice: true,
    juiceResources: {
      webResources: {
        relativeTo: path.resolve(HTML_TEMPLATES_ROOT, options.templateData.name, '..')
      }
    }
  });
  template.render(options.templateData.name, options)
    .then(result => callback(null, Object.assign(options, { html: result })))
    .catch(callback);
};

const generateFriendlyError = function(error) {
  let message, advice;
  const code =  error.errno || error.code;
  switch(code) {
    case 'ENOTFOUND':
      message = `Couldn't connect to SMTP server`;
      advice = `make sure you've specified a valid server`;
      break;
    case 'ECONNREFUSED':
      message = `Connection refused by server`;
      advice = `check you've specified a valid server and port`;
      break;
    case 'ETIMEDOUT':
      message = `Connection attempt timed out`;
      advice = `check you've specified a valid server and port`;
      break;
    case 'EAUTH':
      message = `Authentication failed`;
      advice = `check your account details`;
      break;
    default:
      message = `Unknown error: ${error.message}`;
  }
  return new Error(`Failed to verify SMTP connection. ${message} (${code}), ${advice}`);
};

/**
* Public
*/

const Mailer = function() {
  // store listed CONFIG_SETTINGS from config.json
  CONFIG_SETTINGS.forEach(key => this[key] = configuration.getConfig(key));
  this.transporter = nodemailer.createTransport(getTransporterSettings(this));
};

/**
* Checks the provided SMTP settings using nodemailer.verify, and returns a
* human-friendly error
*/
Mailer.prototype.testConnection = function(callback) {
  if(!this.useSmtp) {
    logger.log('info', 'Mailer.testConnection: SMTP is not enabled.');
    return callback();
  }
  try {
    validateSettings(this);
  } catch(e) {
    return callback(e);
  }
  this.transporter.verify()
    .then(success => callback())
    .catch(error => callback(generateFriendlyError(error)));
};

/**
* Sends an email
* @param {String} toAddress Address to send mail to
* @param {String} subject Email subject line
* @param {String} text Email body
* @param {Object} templateData
* @param {function} callback Function to call on finish
*/
Mailer.prototype.send = function(toAddress, subject, text, templateData, callback) {
  if (!this.useSmtp) {
    logger.log('info', 'Mailer.send: SMTP is not enabled.');
    return callback();
  }
  if(typeof templateData === 'function') {
    callback = templateData;
    templateData = {};
  }
  const app = require('./application')();
  configure({
    from: this.fromAddress,
    to: toAddress,
    subject: subject,
    logoText: app.polyglot.t('app.emaillogotext'),
    greeting: app.polyglot.t('app.greeting'),
    footer: app.polyglot.t('app.emailfooter'),
    text: text,
    templateData: templateData
  }, function(error, options) {
    if (error) {
      return callback(error);
    }
    this.transporter.sendMail(options).then(info => {
      logger.log('info', `Message sent: ${info.response}`);
      callback();
    }).catch(callback);
  }.bind(this));
};

module.exports = Mailer;
