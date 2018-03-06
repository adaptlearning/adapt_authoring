// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
	var ArticleModel = require('core/models/articleModel');
	var BlockModel = require('core/models/blockModel');
	var ContentObjectModel = require('core/models/contentObjectModel');
	var EditorMenuItemView = require('./editorMenuItemView');
  var EditorOriginView = require('../../global/views/editorOriginView');

  var EditorMenuLayerView = EditorOriginView.extend({
    className: 'editor-menu-layer',

    events: {
      'click button.editor-menu-layer-add-page': 'addPage',
      'click button.editor-menu-layer-add-menu': 'addMenu',
      'click .editor-menu-layer-paste': 'pasteMenuItem',
      'click .editor-menu-layer-paste-cancel': 'cancelPasteMenuItem'
    },

    preRender: function(options) {
      if(options._parentId) this._parentId = options._parentId;

      this.listenTo(Origin, {
        'editorView:removeSubViews': this.remove,
        'editorMenuView:removeMenuViews': this.remove
      });
    },

    postRender: function() {
      // Append the parentId value to the container to allow us to move pages, etc.
      if(this._parentId) this.$el.attr('data-parentId', this._parentId);
      this.setHeight();
    },

    render: function() {
      var data = this.data ? this.data : false;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      _.defer(_.bind(this.postRender, this));
      return this;
    },

    setHeight: function() {
      var windowHeight = $(window).height();
      var offsetTop = $('.editor-menu-inner').offset().top;
      var controlsHeight = this.$('.editor-menu-layer-controls').outerHeight();

      this.$('.editor-menu-layer-inner').height(windowHeight-(offsetTop+controlsHeight));
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
      event && event.preventDefault();

      var newMenuItemModel = new ContentObjectModel({
        _parentId: this._parentId,
        _courseId: Origin.editor.data.course.get('_id'),
        title: (type == 'page' ? Origin.l10n.t('app.placeholdernewpage') : Origin.l10n.t('app.placeholdernewmenu')),
        displayTitle: (type == 'page' ? Origin.l10n.t('app.placeholdernewpage') : Origin.l10n.t('app.placeholdernewmenu')),
        body: '',
        linkText: Origin.l10n.t('app.view'),
        graphic: { alt: '', src: '' },
        _type: type
      });
      // Instantly add the view for UI purposes
      var newMenuItemView = this.addMenuItemView(newMenuItemModel);
      newMenuItemModel.save(null, {
        error: function(error) {
          // fade out menu item and alert
          newMenuItemView.$el.removeClass('syncing').addClass('not-synced');
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errormenueditorbody'),
          });
          _.delay(newMenuItemView.remove, 3000);
        },
        success: _.bind(function(model) {
          Origin.editor.data.contentObjects.add(model);
          // Force setting the data-id attribute as this is required for drag-drop sorting
          newMenuItemView.$el.children('.editor-menu-item-inner').attr('data-id', model.get('_id'));
          if (type === 'page') {
            // HACK -- This should be removed and placed on the server-side
            this.addNewPageArticleAndBlock(model, newMenuItemView);
            return;
          }
          newMenuItemView.$el.removeClass('syncing').addClass('synced');
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
        newChildTitle = Origin.l10n.t('app.placeholdernewarticle');
        var newChildModel = new ArticleModel();
      } else {
        typeToAdd = 'block';
        newChildTitle = Origin.l10n.t('app.placeholdernewblock');
        var newChildModel = new BlockModel();
      }

      newChildModel.save({
        title: newChildTitle,
        displayTitle: (typeToAdd == 'block') ? '' : newChildTitle,
        body: '',
        _parentId: model.get('_id'),
        _courseId: Origin.editor.data.course.get('_id')
      }, {
        error: function() {
          newMenuItemView.$el.removeClass('syncing').addClass('not-synced');
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errormenueditorbody'),
          });
          _.delay(newMenuItemView.remove, 3000);
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
      var newMenuItemView = new EditorMenuItemView({ model: model });
      this.$('.editor-menu-layer-inner').append(newMenuItemView.$el.addClass('syncing'));
      return newMenuItemView;
    },

    pasteMenuItem: function(event) {
      event && event.preventDefault();
      Origin.trigger('editorView:paste', this._parentId, this.$('.editor-menu-item').length + 1);
    },

    cancelPasteMenuItem: function(event) {
      event && event.preventDefault();
      this.hidePasteZones();
      var parentId = this._parentId;
      var target = new ContentObjectModel({
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
