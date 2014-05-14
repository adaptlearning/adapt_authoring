define(function(require) {

	var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('coreJS/editor/views/editorOriginView');
  var EditorContentObjectModel = require('coreJS/editor/models/editorContentObjectModel');

  var EditorMenuLayerView = EditorOriginView.extend({

      className: 'editor-menu-layer',

      events: {
        'click button.editor-menu-layer-add-page' : 'addPage',
        'click button.editor-menu-layer-add-menu' : 'addMenu'
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

      addMenu: function(event) {
        this.addMenuItem(event, 'menu');
      },

      addPage: function(event) {
        this.addMenuItem(event, 'page');
      },

      addMenuItem: function(event, type) {
        event.preventDefault();

        new EditorContentObjectModel({
          _parentId: this._parentId,
          _courseId: Origin.editor.data.course.get('_id'),
          title: window.polyglot.t('app.placeholdernewpage'),
          body: window.polyglot.t('app.placeholdereditthistext'),
          linkText: '',
          graphic: {
            alt: '',
            src: ''
          },
          _type: type
        }).save(null, {
          error: function() {
            alert('An error occurred doing the save');
          },
          success: function(model) {
            Origin.trigger('editorView:fetchData');
            Origin.trigger('editorSidebarView:addEditView', model);
          }
        });
      }
  	}, {
  		template: 'editorMenuLayer'
  });

  return EditorMenuLayerView;

});
