define([ 'core/origin' ], function(Origin) {

  var SchemasModel = Backbone.Model.extend({

    url: 'api/content/schema',

    initialize: function() {
      this.listenTo(Origin, 'schemas:loadData', this.loadData);
    },

    loadData: function(callback) {
      if (!Origin.sessionModel.get('isAuthenticated')) {
        return callback();
      }

      // authenticated, so fetch the schemas model
      this.fetch({
        success: function(model) {
          Origin.schemas = model;
          callback();
        },
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorgettingschemas')
          });
        }
      });
    }
  });

  return new SchemasModel;

});
