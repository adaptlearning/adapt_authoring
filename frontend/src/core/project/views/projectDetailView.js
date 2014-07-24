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

      var _this = this;
      
      if (!_this.validateInput()) {
        return;
      }

      if (!_this.model.isNew()) {
        var extensionJson = {};
        extensionJson = _this.getExtensionJson('course');
        _this.model.set({_extensions: extensionJson});
      }

      _this.model.save({title: $.trim(_this.$('#projectDetailTitle').val()),
        body: tinyMCE.get('projectDetailDescription').getContent()
        },
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function(result) {
            Backbone.history.history.back();
            _this.remove();
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
