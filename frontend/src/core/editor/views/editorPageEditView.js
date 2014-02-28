define(function(require) {

  var Backbone = require('backbone');
  var AdaptBuilder = require('coreJS/app/adaptbuilder');
  var EditorView = require('coreJS/editor/views/editorView');

  var PageEditView = EditorView.extend({

    settings: {
      autoRender: false
    },
    
    tagName: "div",

    className: "project",

    events: {
      'click .save-button'   : 'savePage',
      'click .cancel-button' : 'cancel'
    },

    preRender: function() {
      this.listenTo(this.model, 'sync', this.render);
      if (!this.model._id) {
        this.render();
      }
    },

    inputBlur: function (event) {
      //@todo add the validation logic
    },

    cancel: function (event) {
      event.preventDefault();
      
      Backbone.history.navigate('#editor/view/' + this.model.get('_parentId'), {trigger: true});
    },

    savePage: function(event) {
      event.preventDefault();

      var model = this.model;

      model.save({
        title: this.$('.page-title').val(),
        body: this.$('.page-body').val(),
        linkText: this.$('.page-linktext').val(),
        graphic: {
          alt: this.$('.page-graphic-alt').val(),
          src: this.$('.page-graphic-src').val()
        },
        _type: 'page',
        tenantId: 'noidyet'},
        {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function() {
            Backbone.history.navigate('#editor/view/' + model.get('_parentId'), {trigger: true});
          }
        }
      );
    }
  },
  {
    template: 'pageEdit'
  });

  return PageEditView;

});
