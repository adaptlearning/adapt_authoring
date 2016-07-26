// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  var EditorArticleModel = require('editorPage/models/editorArticleModel');
  var EditorBlockModel = require('editorPage/models/editorBlockModel');
  var EditorMenuItemView = require('editorMenu/views/editorMenuItemView');

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
          this.setHeight();
          this.postRender();
        }, this));

        return this;
      },

      setHeight: function() {
        var windowHeight = $(window).height();
        var offsetTop = this.$('.editor-menu-layer-inner').offset().top;
        this.$('.editor-menu-layer-inner').height(windowHeight-offsetTop);
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

        var newMenuItemModel = new EditorContentObjectModel({
          _parentId: this._parentId,
          _courseId: Origin.editor.data.course.get('_id'),
          title: (type == 'page'? window.polyglot.t('app.placeholdernewpage') : window.polyglot.t('app.placeholdernewmenu')),
          displayTitle: (type == 'page'? window.polyglot.t('app.placeholdernewpage') : window.polyglot.t('app.placeholdernewmenu')),
          body: '',
          linkText: window.polyglot.t('app.view'),
          graphic: {
            alt: '',
            src: ''
          },
          _type: type
        });

        // Instantly add the view for UI purposes
        var newMenuItemView = this.addMenuItemView(newMenuItemModel);

        // Save the model
        newMenuItemModel.save(null, {
          error: function(error) {
            // If there's an error show the menu item fading out
            // and show an unobtrusive pop notification
            var timeOut = 3000;
            newMenuItemView.$el.removeClass('syncing').addClass('not-synced');

            Origin.Notify.alert({
              type: 'error',
              text: window.polyglot.t('app.errormenueditorbody'),
            });

            _.delay(function() {
              newMenuItemView.remove();
            }, timeOut);

          },
          success: _.bind(function(model) {
            Origin.editor.data.contentObjects.add(model);
            // Force setting the data-id attribute as this is required for drag-drop sorting
            newMenuItemView.$el.children('.editor-menu-item-inner').attr('data-id', model.get('_id'));

            if (type == 'page') {
              // HACK -- This should be removed and placed on the server-side
              return this.addNewPageArticleAndBlock(model, newMenuItemView);
            } else {
              newMenuItemView.$el.removeClass('syncing').addClass('synced');
            }

            this.setHeight();

          }, this)
        });
      },

      addNewPageArticleAndBlock: function(model, newMenuItemView) {

        var typeToAdd;
        var newChildModel;
        var newChildTitle;

        this.pageModel;
        this.pageView;

        if (model.get('_type') === 'page') {
          this.pageModel = model;
          this.pageView = newMenuItemView;
          typeToAdd = 'article';
          newChildTitle = window.polyglot.t('app.placeholdernewarticle');
          var newChildModel = new EditorArticleModel();
        } else {
          typeToAdd = 'block';
          newChildTitle = window.polyglot.t('app.placeholdernewblock');
          var newChildModel = new EditorBlockModel();
        }

        newChildModel.save({
          title: newChildTitle,
          displayTitle: (typeToAdd == 'block') ? '' : newChildTitle,
          body: '',
          _parentId: model.get('_id'),
          _courseId: Origin.editor.data.course.get('_id')
        }, {
          error: function() {
            var timeOut = 3000;
            newMenuItemView.$el.removeClass('syncing').addClass('not-synced');

            Origin.Notify.alert({
              type: 'error',
              text: window.polyglot.t('app.errormenueditorbody'),
            });

            _.delay(function() {
              newMenuItemView.remove();
            }, timeOut);
          },
          success: _.bind(function(model, response, options) {
            // Add this new element to the collect
            Origin.editor.data[model.get('_type') + 's'].add(model);

            if (typeToAdd === 'article') {
              this.addNewPageArticleAndBlock(model, newMenuItemView);
            } else {
              newMenuItemView.$el.removeClass('syncing').addClass('synced');
            }

          }, this)
        });
      },

      addMenuItemView: function(model) {
        var newMenuItemView = new EditorMenuItemView({
          model: model
        });
        this.$('.editor-menu-layer-inner').append(newMenuItemView.$el.addClass('syncing'));
        return newMenuItemView;
      },

      pasteMenuItem: function(event) {
        event.preventDefault();
        Origin.trigger('editorView:paste', this._parentId, this.$('.editor-menu-item').length + 1);
        /*_.delay(_.bind(function() {
          Origin.trigger('editorView:menuView:updateSelectedItem', this);
        }, this), 2000)*/
      },

      cancelPasteMenuItem: function(event) {
        event.preventDefault();
        $('.add-zone').css('visibility','visible');
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
