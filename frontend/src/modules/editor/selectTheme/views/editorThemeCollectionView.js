// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var EditorOriginView = require('../../global/views/editorOriginView');
  var ThemeCollection = require('../collections/editorThemeCollection');
  var ThemeItemView = require('./editorThemeItemView');

  var EditorThemeCollectionView = EditorOriginView.extend({
    className: "editor-theme-edit",
    tagName: "ul",

    preRender: function() {
      this.collection = new ThemeCollection();
      this.listenTo(this.collection, 'sync', this.addThemeViews);
      this.collection.fetch();

      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorThemeEditSidebar:views:save', this.saveData);
    },

    addThemeViews: function() {
      this.renderThemeViews();
    },

    renderThemeViews: function() {
      this.collection.each(function(theme) {
        var isSelected = theme.get('name') == this.model.get('_theme');

        theme.set('_isSelected', isSelected);
        if(isSelected || theme.get('_isAvailableInEditor') === true) {
          this.$('.theme-list').append(new ThemeItemView({ model: theme }).$el);
        }
      }, this);
      this.setViewToReady();
    },

    cancel: function(event) {
      event && event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      event && event.preventDefault();

      var selectedTheme = this.collection.findWhere({ _isSelected: true });

      if (selectedTheme === undefined) {
        Origin.trigger('sidebar:resetButtons');
        Origin.Notify.alert({
          type: 'error',
          text: Origin.l10n.t('app.errornothemeselected')
        });
        return;
      }

      $.post('/api/theme/' + selectedTheme.get('_id') + '/makeitso/' + this.model.get('_courseId'))
        .error(_.bind(this.onSaveError, this))
        .done(_.bind(this.onSaveSuccess, this));
    },

    onSaveSuccess: function() {
      Origin.trigger('editor:refreshData', _.bind(function() {
        Backbone.history.history.back();
        this.remove();
      }, this));
    },

    onSaveError: function() {
      Origin.Notify.alert({
        type: 'error',
        text: Origin.l10n.t('app.errorsave')
      });
    }
  }, {
    template: 'editorThemeCollection'
  });

  return EditorThemeCollectionView;
});
