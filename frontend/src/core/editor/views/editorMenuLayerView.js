define(function(require) {

	var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');

  var EditorMenuLayerView = EditorOriginView.extend({

      className: 'editor-menu-layer',

      events: {
        'click .editor-menu-layer-add': 'addMenuItem'
      },

      preRender: function(options) {
        if (options._parentId) {
          this._parentId = options._parentId;
        }
        if (options._isCourseObject) {
          this.data = {};
          this.data._isCourseObject = options._isCourseObject;
        }
        this.listenTo(Origin, 'editorView:removeSubViews', this.remove);
        this.listenTo(Origin, 'editorMenuView:removeMenuViews', this.remove);
      },

  		postRender: function() {
  		},

      render: function() {
        var data = this.data ? this.data : false;
        var template = Handlebars.templates[this.constructor.template];
        this.$el.html(template(data));
        _.defer(_.bind(function() {
          this.postRender();
        }, this));
        return this;
      },

      addMenuItem: function(event) {
        event.preventDefault();

        new EditorContentObjectModel({
          _parentId: this._parentId,
          _courseId: Origin.editor.data.course.get('_id'),
          title: 'Placeholder title',
          body: 'Placeholder body text',
          linkText: 'test',
          graphic: {
            alt: 'test',
            src: 'test'
          },
          _type: 'page',
          tenantId: 'noidyet'
        }).save(null, {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function(model) {
            console.log('saving new menu item success');
            Origin.trigger('editorView:fetchData');
            Origin.trigger('editorSidebarView:addEditView', model);
            //Backbone.history.navigate('#/editor/' + Origin.editor.course.get('_id')+ '/page/' + newPage.get('_id'), {trigger: true});
          }
        });


        /*var newPage = new EditorContentObjectModel();

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
              Backbone.history.navigate('#/editor/' + Origin.editor.course.get('_id')+ '/page/' + newPage.get('_id'), {trigger: true});
            }
          }
        );*/
      }

  	}, {
  		template: 'editorMenuLayer'
  });

  return EditorMenuLayerView;

});
