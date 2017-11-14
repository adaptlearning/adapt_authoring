// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var ContentCollection = require('core/collections/contentCollection');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorMenuLayerView = require('./editorMenuLayerView');
  var EditorMenuItemView = require('./editorMenuItemView');

  var EditorMenuView = EditorOriginView.extend({
    className: "editor-menu",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, {
        'editorView:menuView:updateSelectedItem': this.onSelectedItemChanged,
        'window:resize': this.setupHorizontalScroll
      });
    },

    postRender: function() {
      this.contentobjects = new ContentCollection(null, {
        _type: 'contentobject',
        _courseId: Origin.editor.data.course.get('_id')
      });
      this.contentobjects.fetch({
        success: _.bind(function(children) {
          this.contentobjects = children;
          this.renderLayers();
          _.defer(this.setViewToReady);
        }, this),
        error: console.error
      });
    },

    /**
    * Renders all menu layers from the current course to the Origin.editor.currentContentObject
    */
    renderLayers: function() {
      var selectedModel = Origin.editor.currentContentObject;
      // no previous state, so should only render the first level
      if(!selectedModel) {
        this.renderLayer(Origin.editor.data.course);
        return;
      }
      // check if we can reuse any existing layers, and only render the new ones
      this.getItemHeirarchy(selectedModel, function(hierarchy) {
        var index;
        var renderedLayers = this.$('.editor-menu-layer');
        for(var i = 0, count = hierarchy.length; i < count; i++) {
          if($(renderedLayers[i]).attr('data-parentid') === hierarchy[i].get('_id')) {
            index = i+1;
          }
        }
        // we can reuse layers up to 'index', remove the rest
        if(index !== undefined) {
          hierarchy = hierarchy.slice(index);
          var layersToRemove = renderedLayers.slice(index);
          for(var i = 0, count = layersToRemove.length; i < count; i++) {
            layersToRemove[i].remove();
          }
        }
        // all items left in hierarchy are new, render these
        // note setUpInteraction when done
        Helpers.forSeriesAsync(hierarchy, _.bind(function(model, index, callback) {
          this.renderLayer(model, callback);
        }, this), _.defer(_.bind(this.setUpInteraction, this)));
      });
    },

    /**
     * Renders a single menu layer
     */
    renderLayer: function(model, callback) {
      var menuLayerView = new EditorMenuLayerView({
        _parentId: model.get('_id'),
        models: this.contentobjects.where({ _parentId: model.get('_id') })
      });
      $('.editor-menu-inner').append(menuLayerView.$el);
      if(typeof callback === 'function') callback();
    },

    setUpInteraction: function() {
      this.setupDragDrop();
      var $window = $(window);
      this.setupHorizontalScroll($window.width(), $window.height());
      this.scrollToElement();
    },

    /**
    * Generates an array with the inheritence line from a given contentobject to the current course
    * @param {Model} contentModel
    * @return {Array}
    */
    getItemHeirarchy: function(model, done) {
      var hierarchy = [];
      if(model.get('_type') === 'menu') {
        hierarchy.push(model);
      }
      var __this = this;
      var _getParent = function(model, callback) {
        var parent = __this.contentobjects.findWhere({ _id: model.get('_parentId') });
        if(parent) {
          hierarchy.push(parent);
          return _getParent(parent, callback);
        }
        hierarchy.push(Origin.editor.data.course);
        callback();
      };
      _getParent(model, function() {
        if(typeof done === 'function') done.call(__this, hierarchy.reverse());
      });
    },

    onSelectedItemChanged: function(model) {
      if(model.get('_id') === Origin.editor.currentContentObject && Origin.editor.currentContentObject.get('_id')) {
        return;
      }
      Origin.editor.currentContentObject = model;
      this.renderLayers();
    },

    setupHorizontalScroll: function(windowWidth, windowHeight) {
      var $menuLayers = this.$('.editor-menu-layer');
      var $menuView = this.$el;
      var $menuControls = this.$('.editor-menu-layer-controls');
      var itemWidth = $menuLayers.first().outerWidth(true);

      $('.editor-menu-inner').width(itemWidth * $menuLayers.length);
    },

    scrollToElement: function() {
      if ($('.selected').length < 1) {
        return;
      }
      this.$('.editor-menu-layer-inner').scrollTo('.expanded, .selected', { duration: 300, offset: { top: -20, left: 0 }, axis: 'y' });
      this.$el.scrollTo($('.selected').closest('.editor-menu-layer'), { duration: 300, axis: 'x' });
    },

    /**
     * Configures the JQueryUI sortable() plugin to enable drag and drop
     */
    setupDragDrop: function() {
      $(".editor-menu-layer-inner").sortable({
        containment: '.editor-menu',
        appendTo: '.editor-menu',
        items: '.editor-menu-item',
        handle: '.handle',
        connectWith: ".editor-menu-layer-inner",
        scroll: true,
        helper: 'clone',
        stop: _.bind(function(event,ui) {
          var $draggedElement = ui.item;
          var id = $('.editor-menu-item-inner', $draggedElement).attr('data-id');
          var sortOrder = $draggedElement.index() + 1;
          var parentId = $draggedElement.closest('.editor-menu-layer').attr('data-parentId');
          var currentModel = this.contentobjects.findWhere({ _id: id });
          currentModel.save({ _sortOrder: sortOrder, _parentId: parentId }, { patch: true });
          currentModel.set('_isDragging', false);
        }, this),
        over: function(event, ui) {
          $(event.target).closest('.editor-menu-layer').attr('data-over', true);
        },
        out: function(event, ui) {
          $(event.target).closest('.editor-menu-layer').attr('data-over', false);
        },
        receive: function(event, ui) {
          // Prevent moving a menu item between levels
          if (ui.item.hasClass('content-type-menu')) ui.sender.sortable("cancel");
        }
      });
    }
  }, {
    template: 'editorMenu'
  });

  return EditorMenuView;
});
