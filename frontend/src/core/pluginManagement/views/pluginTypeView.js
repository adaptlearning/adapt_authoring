define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var PluginTypeView = OriginView.extend({

    tagName: 'div',

    className: 'pluginType-item',

    events: {
      'change .plugin-toggle-enabled': 'toggleEnabled',
      'click  .plugin-update-check': 'checkForUpdates'
    },

    preRender: function () {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    toggleEnabled: function () {
      // api call to disable/enable item
      this.model.set('_isAvailableInEditor', this.$('.plugin-toggle-enabled').is(':checked'));
      this.model.save();
    },

    checkForUpdates: function (event) {
      event.preventDefault();
      $.ajax({
        'method': 'GET',
        'url': '/api/extensiontype/checkversion/' + this.model.get('_id')
      }).done(function (data) {
        console.log(data);
      });
    },

  }, {
    template: 'pluginType'
  });

  return PluginTypeView;

});
