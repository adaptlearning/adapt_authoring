// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');

  var SchemasModel = Backbone.Model.extend({
    url: 'api/content/schema',

    initialize: function() {
      this.listenTo(Origin, 'schemas:loadData', this.loadData);
    },

    loadData:function(callback) {
      if(!Origin.sessionModel.get('isAuthenticated')) {
        return callback.call();
      }
      // authenticated, so fetch the schemas model
      this.fetch({
        success: function(model) {
          Origin.schemas = model;
          callback.call();
        },
        error: function() {
          Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgettingschemas') });
        }
      });
    }
  });

  return new SchemasModel;
});
