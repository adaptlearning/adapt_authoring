// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OptionsView = require('./views/optionsView');

  var Options = {
    addItems: function(items) {
      $('#app').prepend(new OptionsView({ collection: new Backbone.Collection(items) }).$el);
    }
  };

  Origin.options = Options;
});
