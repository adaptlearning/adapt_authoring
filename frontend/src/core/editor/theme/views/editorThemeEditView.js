// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var ThemeCollection = require('editorTheme/collections/editorThemeCollection');
  var ThemeView = require('editorTheme/views/editorThemeView');

  var EditorThemeEditView = EditorOriginView.extend({
    
    tagName: "ul",

    className: "editor-theme-edit",

    events: {

    },

    preRender: function() {
      this.collection = new ThemeCollection();
      this.listenTo(this.collection, 'sync', this.addThemeViews);
      this.collection.fetch();

      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorThemeEditSidebar:views:save', this.saveData);
    },

    postRender: function() {    
    },

    addThemeViews: function() {
      this.renderThemeViews();
      _.defer(this.setViewToReady);
    },

    renderThemeViews: function() {

      this.collection.each(function(theme) {
        
        var isSelected = false;

        if (theme.get('_id') === this.model.get('_theme')) {
          isSelected = true;
        }

        theme.set('_isSelected', isSelected);
        this.$('.theme-list').append(new ThemeView({model: theme}).$el);

      }, this);

    },

    cancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      if (event) {
        event.preventDefault();  
      }

      var selectedTheme = this.collection.findWhere({_isSelected: true});

      if (selectedTheme === undefined) {
        alert('No theme selected');
        return;
      } 

      var selectedThemeId = selectedTheme.get('_id');
      
      // Should push to api

      $.post('/api/theme/' + selectedThemeId + '/makeitso/' + this.model.get('_courseId'))
        .error(function() {
          alert('An error occurred doing the save');
        })
        .done(_.bind(function() {

          Origin.trigger('editingOverlay:views:hide');
          
          Origin.trigger('editor:refreshData', function() {
            Backbone.history.history.back();
            this.remove();
          }, this);

        }, this));

    }
  },
  {
    template: 'editorThemeEdit'
  });

  return EditorThemeEditView;

});
