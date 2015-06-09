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
      this.listenTo(Origin, 'projectEditSidebar:views:save', this.saveProject);

      if (this.model.isNew()) {
        this.isNew = true;
        this.$el.addClass('project-detail-hide-hero');
        // Initialise the 'tags' property for a new course
        this.model.set('tags', []);
      }
      
      // This next line is important for a proper PATCH request on saveProject()
      this.originalAttributes = _.clone(this.model.attributes);
    },

    postRender: function() {
      EditorOriginView.prototype.postRender.call(this);
    },

    saveProject: function(event) {
      var errors = this.form.commit();
      // This must trigger no matter what, as sidebar needs to know 
      // when the form has been resubmitted
      Origin.trigger('editorSidebar:showErrors', errors);
      if (errors) {
        return;
      }

      // Fix tags
      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        item._id && tags.push(item._id);
      });

      this.model.set('tags', tags);

      // Retrieve any old attributes which might have changed
      // This step is neccessary because otherwise the complete model is passed up
      var changedAttributes = this.model.changedAttributes(this.originalAttributes);
      
      if (changedAttributes || this.isNew) {
        // Only save what has changed
        var attributesToSave = changedAttributes 
          ? _.pick(this.model.attributes, _.keys(changedAttributes))
          : null;

        this.model.save(attributesToSave, {
          patch: true,

          error: function() {
            alert('An error occurred doing the save');
          },
          success: _.bind(function(model, response, options) {
            
            Origin.trigger('editingOverlay:views:hide');
            if (this.isNew) {
              return Backbone.history.navigate('#/editor/' + response._id + '/menu', {trigger: true});
            }
            Origin.trigger('editor:refreshData', function() {
              Backbone.history.history.back();
              this.remove();
            }, this);
            
          }, this)
        });
      } else {
        Backbone.history.history.back();
        this.remove();
      }
    }

  },
  {
    template: 'projectDetail'
  });

  return ProjectDetailView;

});