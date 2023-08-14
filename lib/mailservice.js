const axios = require('axios');
const configuration = require('./configuration');
const logger = require('./logger');
var rest = require('./rest');
var crypto = require('crypto');

const CONFIG_SETTINGS = [
    'useMailService',
    'mailServiceKeys'
  ];

const MailService = function() {
    CONFIG_SETTINGS.forEach(key => this[key] = configuration.getConfig(key));
    if(this.useMailService){
        enableCallbackAPI(this.mailServiceKeys.callbackSecret, this.mailServiceKeys.callbackToken);
    }
};


MailService.prototype.send = function(data, callback){
    if(!this.useMailService){
        logger.log('info', 'MaileService.send: MailService is not enabled.');
        return callback();
    }

    logger.log('info', 'Trying to send email via notification API');

    if(!data.template){
        logger.log('error', 'Mail service requires a template.');
        return callback({message: 'Mail service requires a template.'});
    }
    
    const config = {
        headers: { Authorization: `ApiKey-v1 ${this.mailServiceKeys.apiKey}` }
    };

    const bodyParameters = {
       email_address: data.email,
       template_id: this.mailServiceKeys.templates[data.template],
       personalisation: data.personalisation
    };
    
    axios.post( 
      this.mailServiceKeys.notificationUrl,
      bodyParameters,
      config
    )
    .then(function(data){
        logger.log('info', 'Email sent');
        return callback();
    })
    .catch(function(error){
        logger.log('error', JSON.stringify(error.response.data));
        return callback({message: JSON.stringify(error.response.data)});
    });
}

function enableCallbackAPI(secret, key){
    const hash = crypto.createHash('sha1', secret).update(key).digest('hex');
    rest.post('/email/callback', function (req, res, next) {
	if(req.headers.authorization === `Bearer ${hash}`){
           res.status(200).send({status: "success"});
           console.log(req.body);
        } else {
           res.status(500).send({status: "not-authorized"});
        }
    })
}

module.exports = MailService;
