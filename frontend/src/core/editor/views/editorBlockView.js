define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorComponentModel = require('coreJS/editor/models/EditorComponentModel');
  var EditorComponentView = require('coreJS/editor/views/EditorComponentView');

  var EditorBlockView = EditorOriginView.extend({

    tagName: 'div',

    className: 'block',

    events: {
      'click a.block-edit'     : 'loadPageEdit',
      'click a.block-delete'   : 'deleteBlock',
      'click .copy-block'      : 'onCopy',
      'click .paste-component' : 'onPaste',
      'click .paste-cancel'    : 'pasteCancel',
      'click a.add-component'  : 'addComponent',
    },

    preRender: function() {
      this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
      this.listenTo(Origin, 'editorPageView:removePageSubViews', this.remove);
    },

    postRender: function() {
      this.addComponentViews();
    },

    addComponentViews: function() {
      this.$('.page-article-components').empty();

      this.model.getChildren().each(function(component) {
        this.$('.page-article-components').append(new EditorComponentView({model: component}).$el);
      }, this);
    },

    deleteBlock: function(event) {
      event.preventDefault();

      if (confirm('Are you sure you want to delete this block?')) {
        if (this.model.destroy()) {
          this.remove();
        }
      }
    },

    loadPageEdit: function (event) {
      event.preventDefault();
      Origin.trigger('editorSidebarView:addEditView', this.model);
    },

    addComponent: function(event) {
      event.preventDefault();

      var thisView = this;
      var newComponentModel = new EditorComponentModel();

      newComponentModel.save({
        title: '{Your new component}',
        body: '{Edit this text...}',
        _parentId: thisView.model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id'),
        componentType: 'adapt-contrib-graphic',
        version: 1.0
        // properties: {
        //   "title": "adapt-contrib-graphic",
        //   "type": "object",
        //   "id": "adapt-contrib-graphic",
        //   "required" : true,
        //   "properties": {
        //     "graphic" : {
        //       "title" : "graphic",
        //       "type" : "object",
        //       "id"  : "graphic",
        //       "properties" : {
        //         "alt" : {
        //           "type" : "string"
        //         },
        //         "title" : {
        //           "type" : "string"
        //         },
        //         "large" : {
        //           "type" : "string"
        //         },
        //         "medium" : {
        //           "type" : "string"
        //         },
        //         "small" : {
        //           "type" : "string"
        //         }
        //       }
        //     }
        //   }
        // }

      },
      {
        error: function() {
          alert('error adding new component');
        },
        success: function() {
          Origin.trigger('editorView:fetchData');
        }
      });
    },

  }, {
    template: 'editorBlock'
  });

  return EditorBlockView;

});
