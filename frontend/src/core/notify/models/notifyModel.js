// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var NotifyModel = Backbone.Model.extend({
  });

  NotifyModel.fromError = function(error, extraOptions) {
    if(!extraOptions || !extraOptions._type) {
      var Notify = require('../notify');
      Notify.debug({
        name: 'No type specified',
        body: 'A notification type must be specified.',
        _type: 'log'
      });
      return;
    }

    return new NotifyModel({
      name: error.name,
      body: error.message,
      _type: extraOptions._type
    });
  }

  return NotifyModel;
});
