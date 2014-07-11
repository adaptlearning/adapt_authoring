define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var ProjectDetailView = EditorOriginView.extend({

    tagName: "div",

    className: "project",

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
      this.listenTo(Origin, 'projectEditSidebar:views:save', this.saveProject);
    },

    postRender: function() {
      if (!this.model.isNew()) {
        this.renderExtensionEditor('course');
      }
    },

    cancel: function (event) {
      event.preventDefault();

      Backbone.history.navigate('#/dashboard', {trigger: true});
    },

    validateInput: function() {
      if (!$.trim(this.$('#projectDetailTitle').val())) {
        $('#projectDetailTitle').addClass('input-error');
        $('#titleErrorMessage').text(window.polyglot.t('app.pleaseentervalue'));

        return false;
      } else {
        $('#projectDetailTitle').removeClass('input-error');
        $('#titleErrorMessage').text('');

        return true;
      }
    },

    saveProject: function(event) {
      event && event.preventDefault();

      if (!this.validateInput()) {
        return;
      }

      var isConfigRequired = false;

      if (!this.model.isNew()) {
        var extensionJson = {};
        extensionJson = this.getExtensionJson('course');
        this.model.set({_extensions: extensionJson});
      } else {
        isConfigRequired = true;
      }
            
      this.model.save({title: $.trim(this.$('#projectDetailTitle').val()),
        body: this.$('#projectDetailDescription').val()
        },
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function(result) {
            // Add config
            // TODO Change this when Mongoose schema is corrected
            // This needs to be a single API
            if (isConfigRequired) {
              var config = new EditorConfigModel();

              var configData = {
                '_courseId': result.get('_id'),
                "_questionWeight": "1",
                "_defaultLanguage": "en",
                "_drawer": {
                  "_showEasing":"easeOutQuart",
                  "_hideEasing": "easeInQuart",
                  "_duration": 400
                },
                "_accessibility": {
                  "_isEnabled" : true,
                  "_shouldSupportLegacyBrowsers" : true
                },
                "screenSize": {
                  "small" : 519,
                  "medium" : 759,
                  "large" : 1024
                }
              };
             
              config.save(configData);  
            }
            
            Backbone.history.navigate('#/dashboard', {trigger: true});
          }
        }
      );
    }
  },
  {
    template: 'projectDetail'
  });

  return ProjectDetailView;

});
