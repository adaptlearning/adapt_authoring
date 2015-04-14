// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Notify = require('coreJS/notify/notify');

  var NotifyModel = Backbone.Model.extend({
    'name': undefined,
    'body': undefined,
    '_level': undefined,
    // TODO useful to have a default value for this? (e.g. log)
    '_type': undefined,

    toString: function() {
      var str = "";

      if(this.get('_level')) str += '[' + this.get('_level') + '] ';
      if(this.get('name')) str += this.get('name') + ": ";
      if(this.get('body')) str += this.get('body');

      return str;
    }
  });

  NotifyModel.fromError = function(error, extraOptions) {
    if(!extraOptions || !extraOptions._type) {
      Notify.debug({
        body: 'NotifyModel.fromError: no notification type specified.'
        _template: 'log'
      });
    } else {
      return new NotifyModel({
        name: error.name,
        body: error.message,
        _type: extraOptions._type
      });
    }
  }

  return NotifyModel;
});
