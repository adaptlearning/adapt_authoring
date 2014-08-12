define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var TagsInput = require('core/libraries/jquery.tagsinput.min');

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

      // tagging
      $('#projectTags').tagsInput({
        autocomplete_url: '/api/content/tag/autocomplete',
        onAddTag: _.bind(this.onAddTag, this),
        onRemoveTag: _.bind(this.onRemoveTag, this)
      });
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

      if (!this.model.isNew()) {
        var extensionJson = {};
        extensionJson = this.getExtensionJson('course');
        this.model.set({_extensions: extensionJson});
      }

      // fix tags
      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        item._id && tags.push(item._id);
      });

      var self = this;
      this.model.save({
        title: $.trim(this.$('#projectDetailTitle').val()),
        body: tinyMCE.get('projectDetailDescription').getContent(),
        tags: tags
        }, {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function(result) {
            Backbone.history.history.back();
            self.remove();
          }
        }
      );
    },

    onAddTag: function (tag) {
      var model = this.model;
      $.ajax({
        url:'/api/content/tag',
        method:'POST',
        data: { title: tag }
      }).done(function (data) {
        if (data && data._id) {
          var tags = model.get('tags');
          tags.push({ _id: data._id, title: data.title });
          model.set({ tags: tags });
        }
      });
    },

    onRemoveTag: function (tag) {
      var model = this.model;
      var tags = [];
      _.each(model.get('tags'), function (item) {
        if (item.title !== tag) {
          tags.push(item);
        }
      });
      this.model.set({ tags: tags });
    }

  },
  {
    template: 'projectDetail'
  });

  return ProjectDetailView;

});
