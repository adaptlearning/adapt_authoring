// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var PluginTypeView = OriginView.extend({
    className: 'pluginType-item tb-row',
    tagName: 'div',

    events: {
      'change input.pluginType-enabled': 'toggleEnabled',
      'change input.pluginType-addedDefault': 'toggleAddedDefault',
      'click .plugin-update-check': 'checkForUpdates',
      'click .plugin-update-confirm': 'updatePlugin',
      'click .plugin-remove': 'deletePluginPrompt'
    },

    preRender: function () {
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, {
        sync: this.render,
        destroy: this.remove
      });
    },

    render: function () {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.model.attributes));
      return this;
    },

    toggleEnabled: function () {
      this.model.save({
        _isAvailableInEditor: this.$('.pluginType-enabled').is(':checked')
      }, { patch: true });
    },

    toggleAddedDefault: function() {
      this.model.save({
        _isAddedByDefault: this.$('.pluginType-addedDefault').is(':checked')
      }, { patch: true });
    },

    checkForUpdates: function (event) {
      event && event.preventDefault();

      var $btn = this.$('.plugin-update-check');
      var $icon = $btn.find('i');

      if($btn.is(':disabled')) return false;

      $btn.attr({title: Origin.l10n.t('app.checking')});
      $icon.addClass('fa-spin');

      $.get(this.model.urlRoot + '/checkversion/' + this.model.get('_id'), function(data) {
        if(!data.isUpdateable) {
          $btn.attr({
              disabled: true,
              title: Origin.l10n.t('app.uptodate')
          });
          $icon.removeClass().addClass('fa fa-check');
          return;
        }
        $btn.attr({title: Origin.l10n.t('app.updateplugin')}).removeClass('plugin-update-check').addClass('plugin-update-confirm');
        $icon.removeClass().addClass('fa fa-arrow-up');
      });

      return false;
    },

    updatePlugin: function (event) {
      event && event.preventDefault();
      var $btn = this.$('.plugin-update-confirm');
      var $icon = $btn.find('i');

      if($btn.is(':disabled')) return false;

      $btn.attr({
          disabled: true,
          title: Origin.l10n.t('app.updating')
      });
      $icon.removeClass().addClass('fa fa-refresh fa-spin');

      $.post(this.model.urlRoot + '/update', { 'targets': [ this.model.get('_id') ] })
        .done(function() {
          Origin.trigger('scaffold:updateSchemas', function() {
            $btn.attr('title', Origin.l10n.t('app.uptodate'));
            $icon.removeClass().addClass('fa fa-check');
            this.model.fetch();
          }, this);
        }.bind(this))
        .fail(function() {
          $btn.attr('title', Origin.l10n.t('app.updatefailed'));
          $icon.removeClass().addClass('fa fa-times');
        });

      return false;
    },

    deletePluginPrompt: function(event) {
      event && event.preventDefault();

      $.ajax({
        'method': 'GET',
        'url':  this.model.urlRoot + '/' + this.model.get('_id') + '/uses'
      }).done(function (data) {
        const popup = {};

        if (data.courses.length === 0) {
          Origin.Notify.confirm({
            type: 'warning',
            title: Origin.l10n.t('app.deleteplugin'),
            text: Origin.l10n.t('app.confirmdeleteplugin', { plugin: this.model.get('displayName') }),
            destructive: false,
            callback: this.deletePluginConfirm.bind(this)
          });
          return;
        }

        var courses = '';
        for (var i = 0, len = data.courses.length; i < len; i++) {
          courses += data.courses[i].title + ' ' + Origin.l10n.t('app.by') + ' ' + data.courses[i].createdByEmail + '<br />'
        }
        popup.type = 'error';
        popup.title = Origin.l10n.t('app.cannotdelete') + ' ' + this.model.get('displayName');
        popup.text = Origin.l10n.t('app.coursesused') + '<br />' + courses + '<br />';

        Origin.Notify.alert(popup);

      }.bind(this));
    },

    deletePluginConfirm: function(confirmation) {
      if (!confirmation) return;

      $.ajax({
        method: 'DELETE',
        url: this.model.urlRoot + '/' + this.model.get('_id')
      }).done(this.remove.bind(this));
    }
  }, {
    template: 'pluginType'
  });

  return PluginTypeView;
});
