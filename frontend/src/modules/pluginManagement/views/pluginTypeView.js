// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var PluginTypeView = OriginView.extend({
    className: 'pluginType-item tb-row',
    tagName: 'div',

    events: {
      'change .pluginType-enabled': 'toggleEnabled',
      'click .plugin-update-check': 'checkForUpdates',
      'click .plugin-update-confirm': 'updatePlugin'
    },

    preRender: function () {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, {
        sync: this.render,
        destroy: this.remove
      });
    },

    toggleEnabled: function () {
      this.model.save({
        _isAvailableInEditor: this.$('.pluginType-enabled').is(':checked')
      }, { patch: true });
    },

    checkForUpdates: function (event) {
      event && event.preventDefault();

      var $btn = this.$('.plugin-update-check');

      if($btn.is(':disabled')) return false;

      $btn.html(Origin.l10n.t('app.checking'));

      $.get(this.model.urlRoot + '/checkversion/' + this.model.get('_id'), function(data) {
        if(!data.isUpdateable) {
          $btn.attr('disabled', true).html(Origin.l10n.t('app.uptodate'));
          return;
        }
        $btn.removeClass('plugin-update-check').addClass('plugin-update-confirm').html(Origin.l10n.t('app.updateplugin'));
      });

      return false;
    },

    updatePlugin: function (event) {
      event && event.preventDefault();
      var $btn = this.$('.plugin-update-confirm');

      if($btn.is(':disabled')) return false;

      $btn.attr('disabled', true).html(Origin.l10n.t('app.updating'));

      $.post(this.model.urlRoot + '/update', { 'targets': [this.model.get('_id')] }, _.bind(function(data) {
        if(!_.contains(data.upgraded, this.model.get('_id'))) {
          $btn.html(Origin.l10n.t('app.updatefailed'));
          return;
        }
        Origin.trigger('scaffold:updateSchemas', function() {
          $btn.html(Origin.l10n.t('app.uptodate'));
          this.model.fetch();
        }, this);
      }, this));

      return false;
    }
  }, {
    template: 'pluginType'
  });

  return PluginTypeView;
});
