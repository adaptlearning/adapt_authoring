// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorComponentListItemView = require('editorPage/views/editorComponentListItemView');

  var EditorComponentListView = EditorOriginView.extend({
    tagName: "div",
    className: "editor-component-list",

    events: {
      'click': 'onOverlayClicked',
      'click .editor-component-list-sidebar-exit, .click-capture': 'closeView',
      'keyup .editor-component-list-sidebar-search input': 'onSearchKeyup'
    },

    preRender: function(options) {
      $('html').css('overflow-y', 'hidden');

      this.listenTo(Origin, 'editorComponentListView:remove', this.remove);
      this.listenTo(Origin, 'window:resize', this.onScreenResize);

      this.setupCollection();
      this.setupFilters();

      this.$parentElement = options.$parentElement;
      this.parentView = options.parentView;
    },

    setupCollection: function() {
      var availableComponents = _.where(this.model.get('componentTypes'), { _isAvailableInEditor: true });
      this.collection = new Backbone.Collection(availableComponents);
    },

    setupFilters: function() {
      this.availablePositions = {
        left: false,
        right: false,
        full: false
      };

      _.each(this.model.get('layoutOptions'), function(layoutOption) {
        switch(layoutOption.type) {
          case 'left':
            this.availablePositions.left = true;
            break;
          case 'right':
            this.availablePositions.right = true;
            break;
          case 'full':
            this.availablePositions.full = true;
            break;
        }
      }, this);

      this.model.set('_availablePosition', this.availablePositions);
    },

    postRender: function() {
      this.renderComponentList();
      this.headerHeight = this.$('.editor-component-list-sidebar-header').height();
      $(window).resize();
      // move bar into place and animate in
      this.$el.css({ right:this.$('.editor-component-list-sidebar').width()*-1}).animate({ right:"0" }, 400,"easeOutQuart");
    },

    closeView: function() {
      var self = this;
      this.$el.animate({ right:this.$('.editor-component-list-sidebar').width() *- 1 }, 400,"easeOutQuart", function onAnimOut() {
        $('html').css('overflow-y', '');
        self.remove();
      });
    },

    renderComponentList: function() {
      Origin.trigger('editorComponentListView:removeSubviews');
      // _.each(this.collection, function(componentType) {

      this.collection.each(function(componentType) {
        var properties = componentType.get('properties');
        if (properties && properties.hasOwnProperty('_supportedLayout')) {
          var supportedLayout = properties._supportedLayout.enum;
          var availablePositions = _.clone(this.availablePositions);

          // Prune the available positions
          if (_.indexOf(supportedLayout, 'half-width') == -1) {
            availablePositions.left = false;
            availablePositions.right = false;
          }

          if (_.indexOf(supportedLayout, 'full-width') == -1) {
            availablePositions.full = false;
          }
        }

        this.$('.editor-component-list-sidebar-list').append(new EditorComponentListItemView({
          model: componentType,
          availablePositions: availablePositions,
          _parentId: this.model.get('_parentId'),
          $parentElement: this.$parentElement,
          parentView: this.parentView,
          searchTerms: componentType.get('displayName').toLowerCase()
        }).$el);
      }, this);
    },

    onOverlayClicked: function(event) {
      if ($(event.target).hasClass('editor-component-list')) {
        Origin.trigger('editorComponentListView:removeSubviews');
        $('html').css('overflow-y', '');
        this.remove();
      }
    },

    onSearchKeyup: function(event) {
      var searchValue = $(event.currentTarget).val();
      Origin.trigger('editorComponentListView:searchKeyup', searchValue);
    },

    onScreenResize: function(windowWidth, windowHeight) {
      this.$('.editor-component-list-sidebar-list').height(windowHeight - this.headerHeight);
    }
  },
  {
    template: 'editorComponentList'
  });

  return EditorComponentListView;
});