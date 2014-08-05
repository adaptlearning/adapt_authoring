define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorThemeEditView = EditorOriginView.extend({
    
    tagName: "div",

    className: "editor-theme-edit",

    events: {
      'click .editing-overlay-panel-title': 'toggleContentPanel'
    },

    toggleContentPanel: function(event) {
      event.preventDefault();
      if (!$(event.currentTarget).hasClass('active')) { 
        this.$('.editing-overlay-panel-title').removeClass('active');
        $(event.currentTarget).addClass('active')
        this.$('.editing-overlay-panel-content').slideUp();
        $(event.currentTarget).siblings('.editing-overlay-panel-content').slideDown();
      }
    },

    preRender: function() {
      this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
      this.listenTo(Origin, 'editorThemeEditSidebar:views:save', this.saveData);

    },

    postRender: function() {     
    },

    cancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      if (event) {
        event.preventDefault();  
      }
      
      var _this = this;
      // var extensionJson = {};

      // extensionJson = this.getExtensionJson('config');

      _this.model.save({
        // _defaultLanguage: this.$('.config-defaultLanguage').val(),
        // _questionWeight: this.$('.config-questionWeight').val(),
        // _drawer: {
        //   _showEasing: this.$('.config-drawershoweasing').val(),
        //   _hideEasing: this.$('.config-drawerhideeasing').val(),
        //   _duration: this.$('.config-drawerduration').val()
        // },
        // _accessibility: {
        //   _isEnabled: this.$('.config-accessibilityenabled').val(),
        //   _shouldSupportLegacyBrowsers: this.$('.config-accessibilitylegacy').val()
        // },
        // _extensions: extensionJson
      },
      {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {
          Origin.trigger('editingOverlay:views:hide');
          Origin.trigger('editorView:fetchData');
          Backbone.history.history.back();
          _this.remove();
        }
      });
    }
  },
  {
    template: 'editorThemeEdit'
  });

  return EditorThemeEditView;

});
