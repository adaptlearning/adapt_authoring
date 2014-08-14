define(function(require) {

	var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');

  var EditorMenuLayerView = EditorOriginView.extend({

      className: 'editor-menu-layer',

      events: {
        'click button.editor-menu-layer-add-page' : 'addPage',
        'click button.editor-menu-layer-add-menu' : 'addMenu',
        'click .editor-menu-layer-paste'          : 'pasteMenuItem',
        'click .editor-menu-layer-paste-cancel'   : 'cancelPasteMenuItem'
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
        if (this._parentId) {
          // Append the parentId value to the container to allow us to move pages, etc.
          this.$el.attr('data-parentId', this._parentId);
        }
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

      /**
       * Adds a new contentObject of a given type
       * @param {String} type Given contentObject type, i.e. 'menu' or 'page'
       */
      addMenuItem: function(event, type) {
        event.preventDefault();

        new EditorContentObjectModel({
          _parentId: this._parentId,
          _courseId: Origin.editor.data.course.get('_id'),
          title: (type == 'page'? window.polyglot.t('app.placeholdernewpage') : window.polyglot.t('app.placeholdernewmenu')),
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
            Origin.trigger('editor:refreshData', function() {
              Origin.trigger('editorSidebarView:addEditView', model);
            }, this);
          }
        });
      },

      pasteMenuItem: function(event) {
        event.preventDefault();
        var clipboard = Origin.editor.data.clipboard.models[0];
        var topitem = clipboard.get(clipboard.get('referenceType'))[0];
        var parentId = this._parentId;
        var target = new EditorContentObjectModel({
          _parentId: parentId,
          _courseId: Origin.editor.data.course.get('_id'),
          _type: topitem._type
        });
        Origin.trigger('editorView:paste', parentId, this.$('.editor-menu-item').length + 1);
      },

      cancelPasteMenuItem: function(event) {
        event.preventDefault();
        var parentId = this._parentId;
        var target = new EditorContentObjectModel({
          _parentId: parentId,
          _courseId: Origin.editor.data.course.get('_id')
        });
        Origin.trigger('editorView:pasteCancel', target);
      }
  	}, {
  		template: 'editorMenuLayer'
  });

  return EditorMenuLayerView;

});
