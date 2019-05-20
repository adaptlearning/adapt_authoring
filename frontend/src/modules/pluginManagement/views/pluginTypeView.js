// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var PluginTypeView = OriginView.extend({
    className: 'pluginType-item tb-row',
    tagName: 'div',

    events: {
      'click input.pluginType-enabled': 'toggleEnabled',
      'click input.pluginType-addedDefault': 'toggleAddedDefault',
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

      if($btn.is(':disabled')) return false;

      $btn.find('i').addClass('fa-spin');

      $.get(this.model.urlRoot + '/checkversion/' + this.model.get('_id'), function(data) {
        if(!data.isUpdateable) {
          $btn.attr('disabled', true).find('i').removeClass().addClass('fa fa-check');
          return;
        }
        $btn.removeClass('plugin-update-check').addClass('plugin-update-confirm').find('i').removeClass().addClass('fa fa-arrow-up');
      });

      return false;
    },

    updatePlugin: function (event) {
      event && event.preventDefault();
      var $btn = this.$('.plugin-update-confirm');

      if($btn.is(':disabled')) return false;

      $btn.attr('disabled', true).find('i').removeClass().addClass('fa fa-refresh fa-spin');

      $.post(this.model.urlRoot + '/update', { 'targets': [this.model.get('_id')] }, _.bind(function(data) {
        if(!_.contains(data.upgraded, this.model.get('_id'))) {
          $btn.find('i').removeClass().addClass('fa fa-times');
          return;
        }
        Origin.trigger('scaffold:updateSchemas', function() {
          $btn.find('i').removeClass().addClass('fa fa-check');
          this.model.fetch();
        }, this);
      }, this));

      return false;
    },

    deletePluginPrompt: function(event) {
      event && event.preventDefault();
      const _this = this;

      $.ajax({
        'method': 'GET',
        'url':  this.model.urlRoot + '/' + this.model.get('_id') + '/uses'
      }).done(function (data) {
        const popup = {};

        if (data.courses.length === 0) {
          popup.text = _this.model.get('displayName') + ' is unused';
          popup.type = 'confirm';
          popup.destructive = false;
          popup.callback = _.bind(_this.deletePluginConfirm, _this);
          Origin.Notify.confirm(popup);
        } else {
          var courses = '';
          for (var i = 0, len = data.courses.length; i < len; i++) {
            courses += '<i>' + data.courses[i].title + '</i> By <i>' + data.courses[i].createdByEmail + '</i><br />'
          }
          popup.type = 'error';
          popup.title = 'Cannot Delete ' + _this.model.get('displayName');
          popup.text = '';
          if (courses !== '') {
            popup.text += 'This plugin is used in the following courses:' + '<br />';
            popup.text += courses + '<br />';
          }
          Origin.Notify.alert(popup);
        }
      });
    },

    deletePluginConfirm: function(confirmation) {
      var _this = this;
      if (confirmation === true) {
        $.ajax({
          'method': 'DELETE',
          'url': this.model.urlRoot + '/' + this.model.get('_id')
        }).done(function () {
           _this.remove()
        });
      }
    }
  }, {
    template: 'pluginType'
  });

  return PluginTypeView;
});
