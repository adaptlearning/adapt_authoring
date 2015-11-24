// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorComponentListItemView = require('editorPage/views/editorComponentListItemView');

  var EditorComponentListView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-component-list",

    events: {
      'click': 'onOverlayClicked',
      'click .editor-component-list-sidebar-exit': 'closeView',
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
      this.collection = new Backbone.Collection(this.model.get('componentTypes'));
    },

    setupFilters: function() {
      var layoutOptions = this.model.get('layoutOptions');
      // Checks the available layouts in the block
      this.availablePositions = {
        left: false,
        right: false,
        full: false
      };

      _.each(layoutOptions, function(layoutOption) {
        var type = layoutOption.type;
        if (type === 'left') {
          this.availablePositions.left = true;
        } else if (type === 'right') {
          this.availablePositions.right = true;
        } else if (type === 'full') {
          this.availablePositions.full = true;
        }
      }, this);

      this.model.set('_availablePosition', this.availablePositions);
    },

    postRender: function() {
      this.renderComponentList();
      this.headerHeight = this.$('.editor-component-list-sidebar-header').height();
      $(window).resize();
    },

    closeView: function() {
      $('html').css('overflow-y', '');
      this.remove();
    },

    renderComponentList: function() {
      Origin.trigger('editorComponentListView:removeSubviews');
      var componentTypes = this.model.get('componentTypes');

      _.each(componentTypes, function(componentType) {

        // Checks whether this component has the right supportedLayouts
        var availablePositions = {
          left: false,
          right: false,
          full: false
        };

        if (componentType.properties) {
          if (componentType.properties._supportedLayout) {
            // Each component should have a _supportedLayout array that tells us
            // which layout is supported by the component
            var supportedLayout = componentType.properties._supportedLayout.enum;
            
            if (_.contains(supportedLayout, 'half-width') && this.availablePositions.left) {
              availablePositions.left = true;
            }

            if (_.contains(supportedLayout, 'half-width') && this.availablePositions.right) {
              availablePositions.right = true;
            }

            if (_.contains(supportedLayout, 'full-width') &&  this.availablePositions.full) {
              availablePositions.full = true;
            }

          }
        }

        this.$('.editor-component-list-sidebar-list').append(new EditorComponentListItemView({
          model: new Backbone.Model(componentType),
          availablePositions: availablePositions,
          _parentId: this.model.get('_parentId'),
          $parentElement: this.$parentElement,
          parentView: this.parentView,
          searchTerms: componentType.displayName.toLowerCase()
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