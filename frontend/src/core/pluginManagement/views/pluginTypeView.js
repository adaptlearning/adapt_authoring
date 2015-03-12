// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var PluginTypeView = OriginView.extend({

    tagName: 'div',

    className: 'pluginType-item tb-row',

    events: {
      'change .pluginType-enabled':   'toggleEnabled',
      'click .plugin-update-check':   'checkForUpdates',
      'click .plugin-update-confirm': 'updatePlugin'
    },

    preRender: function () {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    toggleEnabled: function () {
      // api call to disable/enable item
      // NB: disable this functionality until we come up with a plan for courses
      // that added plugins that were subsequently disabled
      this.model.save({_isAvailableInEditor: this.$('.pluginType-enabled').is(':checked')}, {patch: true});
    },

    checkForUpdates: function (event) {
      event.preventDefault();
      var btn = this.$('.plugin-update-check');
      if (btn.hasClass('disabled')) {
        return false;
      }

      btn.html(window.polyglot.t('app.checking'));
      $.ajax({
        'method': 'GET',
        'url': this.model.urlRoot + '/checkversion/' + this.model.get('_id')
      }).done(function (data) {
        if (data.isUpdateable) {
          btn.removeClass('plugin-update-check').addClass('plugin-update-confirm').html(window.polyglot.t('app.updateplugin'));
        } else {
          btn.addClass('disabled');
          btn.html(window.polyglot.t('app.uptodate'));
        }
      });

      return false;
    },

    updatePlugin: function (event) {
      event.preventDefault();
      var that = this;
      var btn = this.$('.plugin-update-confirm');
      if (btn.hasClass('disabled')) {
        return false;
      }

      btn.html(window.polyglot.t('app.updating'));
      btn.addClass('disabled');

      // hit the update endpoint
      $.ajax({
        'method': 'POST',
        'url': this.model.urlRoot + '/update',
        'data': {
          'targets': [this.model.get('_id')]
        }
      }).done(function (data) {
        if (_.contains(data.targets), that.model.get('_id')) {
          // Refresh the schemas
          Origin.trigger('scaffold:updateSchemas', function() {
            btn.html(window.polyglot.t('app.uptodate'));
          }, this);
        } else {
          btn.html(window.polyglot.t('app.updatefailed'));
        }
      });

      return false;
    }

  }, {
    template: 'pluginType'
  });

  return PluginTypeView;

});
