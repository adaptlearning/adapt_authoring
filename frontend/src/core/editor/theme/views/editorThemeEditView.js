define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var ThemeCollection = require('editorTheme/collections/editorThemeCollection');
  var ThemeView = require('editorTheme/views/editorThemeView');

  var EditorThemeEditView = EditorOriginView.extend({
    
    tagName: "div",

    className: "editor-theme-edit",

    events: {

    },

    preRender: function() {
      this.collection = new ThemeCollection();
      this.collection.fetch();

      this.listenTo(this.collection, 'sync', this.addThemeViews);

      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorThemeEditSidebar:views:save', this.saveData);
    },

    postRender: function() {     
    },

    addThemeViews: function() {
      this.renderThemeViews(this.collection.models);
    },

    renderThemeViews: function(themes) {
      _.each(themes, function(theme) {
        this.$('.theme-list').append(new ThemeView({model: theme}).$el);
      }, this);

      this.setSelectedTheme();
    },

    setSelectedTheme: function() {
      var selectedTheme = this.model.get('_theme'),
        $themes;

      if (selectedTheme) {
        $themes = $('.theme-item');

        _.each($themes, function(theme) {
          if (theme.dataset.id == selectedTheme) {
            // This theme should be selected
            $(theme.parentNode).addClass('selected');
          }
        });
      } 
    },

    cancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      if (event) {
        event.preventDefault();  
      }

      var selectedItem = $('.theme-list-item.selected'),
        _this = this,
        selectedThemeId;

      if (selectedItem.length == 0) {
        alert('No theme selected');
        return;
      } 

      selectedThemeId = selectedItem[0].childNodes[0].dataset.id
      
      _this.model.save({
        _theme: selectedThemeId
      },
      {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {

          Origin.trigger('editingOverlay:views:hide');
          
          Origin.trigger('editor:refreshData', function() {
            Backbone.history.history.back();
            _this.remove();
          }, this);
          
        }
      });
    }
  },
  {
    template: 'editorThemeEdit'
  });

  return EditorThemeEditView;

});
