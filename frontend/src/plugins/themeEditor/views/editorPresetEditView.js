// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var Helpers = require('coreJS/app/helpers');

  var PresetEditView = Backbone.View.extend({
    tagName: 'div',
    className: 'presetEdit',

    events: {
      'click a.button.close': 'onCloseClicked',
      'click a.button.edit': 'onEditClicked',
      'click a.button.save': 'onSaveClicked',
      'click a.button.cancel': 'onCancelClicked',
      'click a.button.delete': 'onDeleteClicked'
    },

    initialize: function() {
      this.listenTo(this.model.get('presets'), 'change', this.render);
      this.render();
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.model.toJSON()));
      return this;
    },

    onCloseClicked: function(event) {
      event && event.preventDefault();
      this.remove();
    },

    onEditClicked: function(event) {
      event && event.preventDefault();
      var $preset = $(event.currentTarget).closest('.preset');
      $('.name', $preset).hide();
      $('.nameEdit', $preset).show();
    },

    onSaveClicked: function(event) {
      event && event.preventDefault();
      var $preset = $(event.currentTarget).closest('.preset');
      // look out for injection attacks
      var newValue = Helpers.escapeText($('input', $preset).val());

      Origin.trigger('managePresets:edit', {
        oldValue: $preset.attr('data-name'),
        newValue: newValue
      });
    },

    onCancelClicked: function(event) {
      event && event.preventDefault();
      var $preset = $(event.currentTarget).closest('.preset');
      $('.nameEdit', $preset).hide();
      $('.name', $preset).show();
    },

    onDeleteClicked: function(event) {
      event && event.preventDefault();
      var self = this;
      var presetName = $(event.currentTarget).closest('.preset').attr('data-name');
      Origin.Notify.confirm({
        text: window.polyglot.t('app.presetdeletetext', { preset: presetName }),
        callback: function(confirmed) {
          if(confirmed === true) {
            Origin.trigger('managePresets:delete', presetName);
            self.render();
          }
        }
      });
    }
  }, {
    template: 'editorPresetEdit'
  });

  return PresetEditView;
});
