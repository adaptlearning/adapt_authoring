// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var NotifyModel = Backbone.Model.extend({
    // TODO add error checks for creating new models (_type/_level)
    'title': undefined,
    'message': undefined,
    '_level': undefined,
    // TODO useful to have a default value for this? (e.g. log)
    '_type': undefined,

    initialize: function() {
      this.translateAttribute('title', this.get('title'));
      this.translateAttribute('message', this.get('message'));

      this.on('change:title', function(model, value) {
        this.translateAttribute('title', value);
      });
      this.on('change:message', function(model, value) {
        this.translateAttribute('message', value);
      });
    },

    translateAttribute: function(attr, value) {
      var translated = window.polyglot.t(value);
      if(value !== translated) {
        this.set(attr, translated, { silent: true });
      }
    },

    toString: function() {
      var str = "";

      if(this.get('_level')) str += '[' + this.get('_level') + '] ';
      if(this.get('title')) str += this.get('title') + ": ";
      if(this.get('message')) str += this.get('message');

      return str;
    }
  });

  NotifyModel.fromError = function(error, extraOptions) {
    if(!extraOptions || !extraOptions._type) {
      var Notify = require('../notify');
      Notify.error({
        title: 'NotifyModel.fromError: no notification type specified.',
        _template: 'log'
      });
    } else {
      return new NotifyModel({
        title: error.name,
        message: error.message,
        _type: extraOptions._type
      });
    }
  }

  return NotifyModel;
});
