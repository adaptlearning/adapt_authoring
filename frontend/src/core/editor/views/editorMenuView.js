define(function(require){

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorMenuItemView = require('coreJS/editor/views/editorMenuItemView');
  var EditorMenuLayerView = require('coreJS/editor/views/editorMenuLayerView');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');
  
  var EditorMenuView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-menu",

    events: {
      'click .fake-add-page-button':'addPage'
    },

    preRender: function() {
      this.listenTo(Origin, 'editor:removeSubViews', this.remove);
    },

    postRender: function() {
      this.setupMenuViews();
    },

    setupMenuViews: function() {
      this.setupCourseViews();

      var layerOne = this.renderMenuLayerView(this.model.get('_id'));
      this.model.getChildren().each(function(contentObject) {
        layerOne.append(new EditorMenuItemView({
          model: contentObject
        }).$el)
      }, this);
    },

    setupCourseViews: function() {
      this.renderMenuLayerView().append(new EditorMenuItemView({model:this.model}).$el);
    },

    renderMenuLayerView: function(parentId) {
      var menuLayerView = new EditorMenuLayerView({_parentId:parentId})
      this.$('.editor-menu-inner').append(menuLayerView.$el);
      return menuLayerView.$('.editor-menu-layer-inner');
    },
// This should be removed
    addPage: function(event) {
      event.preventDefault();
      var newPage = new EditorContentObjectModel();

      newPage.save({
        _parentId: Origin.editor.course.get('_id'),
        _courseId: Origin.editor.course.get('_id'),
        title: 'Placeholder title',
        body: 'Placeholder body text',
        linkText: 'test',
        graphic: {
          alt: 'test',
          src: 'test'
        },
        _type: 'page',
        tenantId: 'noidyet'},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function(model) {
            console.log(model);
            Backbone.history.navigate('#/editor/' + Origin.editor.course.get('_id')+ '/page/' + newPage.get('_id'), {trigger: true});
          }
        }
      );
    }

  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;

});
