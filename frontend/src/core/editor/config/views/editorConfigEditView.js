define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorConfigEditView = EditorOriginView.extend({
    
    tagName: "div",

    className: "editor-config-edit",

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
      this.listenTo(Origin, 'editorConfigEditSidebar:views:save', this.saveData);

      var easings = [
        {type: 'easeInSine'},
        {type: 'easeOutSine'},
        {type: 'easeInOutSine'},
        {type: 'easeInQuad'},
        {type: 'easeOutQuad'},
        {type: 'easeInOutQuad'},
        {type: 'easeInCubic'},
        {type: 'easeOutCubic'},
        {type: 'easeInOutCubic'},
        {type: 'easeInQuart'},
        {type: 'easeOutQuart'},
        {type: 'easeInOutQuart'},
        {type: 'easeInQuint'},
        {type: 'easeOutQuint'},
        {type: 'easeInOutQuint'},
        {type: 'easeInExpo'},
        {type: 'easeOutExpo'},
        {type: 'easeInOutExpo'},
        {type: 'easeInCirc'},
        {type: 'easeOutCirc'},
        {type: 'easeInOutCirc'},
        {type: 'easeInBack'},
        {type: 'easeOutBack'},
        {type: 'easeInOutBack'},
        {type: 'easeInElastic'},
        {type: 'easeOutElastic'},
        {type: 'easeInOutElastic'},
        {type: 'easeInBounce'},
        {type: 'easeOutBounce'},
        {type: 'easeInOutBounce'}
      ];

      var showEasing = this.model.get('_drawer')._showEasing,
        hideEasing = this.model.get('_drawer')._hideEasing,
        duration = this.model.get('_drawer')._duration;

      // The following properties are only defined for the UI
      this.model.set('_easings', easings);
      this.model.set('_showEasing', showEasing);
      this.model.set('_hideEasing', hideEasing);
      this.model.set('_duration', duration);
    },

    postRender: function() {     
      this.renderExtensionEditor('config');
    },

    cancel: function(event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:removeEditView', this.model);
    },

    saveData: function(event) {
      if (event) {
        event.preventDefault();  
      }
      
      var model = this.model;
      var extensionJson = {};

      extensionJson = this.getExtensionJson('config');

      model.save({
        _defaultLanguage: this.$('.config-defaultLanguage').val(),
        _questionWeight: this.$('.config-questionWeight').val(),
        _drawer: {
          _showEasing: this.$('.config-drawershoweasing').val(),
          _hideEasing: this.$('.config-drawerhideeasing').val(),
          _duration: this.$('.config-drawerduration').val()
        },
        _accessibility: {
          _isEnabled: true,
          _shouldSupportLegacyBrowsers: true
        },
        _extensions: extensionJson
      },
      {
        error: function() {
          alert('An error occurred doing the save');
        },
        success: function() {
          Origin.trigger('editingOverlay:views:hide');
          Origin.trigger('editorView:fetchData');
          Backbone.history.history.back();
          this.remove();
        }
      });
    }
  
  },
  {
    template: 'editorConfigEdit'
  });

  return EditorConfigEditView;

});
