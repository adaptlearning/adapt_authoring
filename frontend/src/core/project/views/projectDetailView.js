// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var ProjectDetailView = EditorOriginView.extend({

    tagName: "div",

    className: "course-edit",

    preRender: function() {
      this.listenTo(Origin, 'projectEditSidebar:views:save', this.save);

      if (this.model.isNew()) {
        this.isNew = true;
        this.$el.addClass('project-detail-hide-hero');
        // Initialise the 'tags' property for a new course
        this.model.set('tags', []);
      } else {
        // Ensure that the latest config model is always up-to-date when entering this screen
        Origin.editor.data.config = new EditorConfigModel({_courseId: this.model.get('_id')});
      }

      // This next line is important for a proper PATCH request on saveProject()
      this.originalAttributes = _.clone(this.model.attributes);
    },

    getAttributesToSave: function() {
      // set tags
      var tags = [];
      _.each(this.model.get('tags'), function(item) {
        item._id && tags.push(item._id);
      });
      this.model.set('tags', tags);

      var changedAttributes = this.model.changedAttributes(this.originalAttributes);
      if(changedAttributes) {
        return _.pick(this.model.attributes, _.keys(changedAttributes));
      }

      return null;
    },

    onSaveSuccess: function(model, response, options) {
      if (this.isNew) {
        return Origin.router.navigate('#/editor/' + response._id + '/menu', {trigger: true});
      } else {
        EditorOriginView.prototype.onSaveSuccess.apply(this, arguments);
      }
    },

    // TODO not really  good enough to handle model save errors and other errors here
    onSaveError: function(model, response, options) {
      if(arguments.length == 2) {
        return EditorOriginView.prototype.onSaveError.apply(this, arguments);
      }

      var messageText = typeof response.responseJSON == 'object' && response.responseJSON.message;
      EditorOriginView.prototype.onSaveError.call(this, null, messageText);
    }
  },
  {
    template: 'projectDetail'
  });

  return ProjectDetailView;
});
