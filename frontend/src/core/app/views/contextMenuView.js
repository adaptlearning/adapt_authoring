// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  /**
  * ContextMenuView
  */

  var ContextMenuView = Backbone.View.extend({
    className: 'context-menu',
    contextView : {},

    events: {
      'click .context-menu-close':'onCloseContextMenu'
    },

    initialize: function() {
      this._isVisible = false;
      this.listenTo(Origin, 'contextMenu:open', this.onOpenContextMenu);
      this.listenTo(Origin, 'contextMenu:closeContextMenu', this.onCloseContextMenu);
      this.listenTo(Origin, 'remove', this.onCloseContextMenu);
      this.listenTo(Origin, 'remove:views', this.onCloseContextMenu);
      this.render();
    },

    render: function() {
      var template = Handlebars.templates['contextMenu'];
      $(this.el).html(template).appendTo('body');
      return this;
    },

    renderItems: function() {
      Origin.trigger('contextMenu:empty');
      this.emptyContextMenu();
      var contextView = this.contextView;
      var filtered = this.collection.where({ type:this.type });
      _.each(filtered, function(item) {
        item.set('contextView', contextView);
        new ContextMenuItemView({ model: item });
      });
    },

    listenToBodyClick: function() {
      $('html').one('click', _.bind(this.onCloseContextMenu, this));
    },

    unlistenToBodyClick: function() {
      $('html').off('click');
    },

    showContextMenu: function(emptyContextMenu, e) {
      if (emptyContextMenu) {
        this.emptyContextMenu();
        this.renderItems();
        Origin.trigger('contextMenu:openedItemView');
      }

      this.$el.css({
        position: 'absolute',
        left: $(e.currentTarget).offset().left + $(e.currentTarget).width() + 10,
        top: $(e.currentTarget).offset().top-($(e.currentTarget).height()/2)
      })
      .removeClass('display-none');

      this.listenToBodyClick();

      Origin.trigger('contextMenu:opened');
    },

    hideContextMenu: function() {
      this.$el.addClass('display-none');
      this.unlistenToBodyClick();
      Origin.trigger('contextMenu:closed');
    },

    emptyContextMenu: function() {
      this.$('.context-menu-holder').empty();
    },

    /**
    * Events
    */

    onOpenContextMenu: function(view, e) {
      this.contextView = view;

      var type = view.model.get('_type');

      if (type == 'course' && !view.model.isEditable()) {
        type = 'sharedcourse';
      }
      this.type = type;

      // toggle
      if (this._isVisible) {
        this._isVisible = false;
        this.hideContextMenu();
      } else {
        this._isVisible = true;
        this.showContextMenu(true, e);
      }
    },

    onCloseContextMenu: function(e) {
      e && e.preventDefault();
      this._isVisible = false;
      this.hideContextMenu();
    }

  });

  /**
  * ContextMenuItemView
  */

  var ContextMenuItemView = Backbone.View.extend({
    className: 'context-menu-item',

    events: {
      'click .context-menu-item-open': 'onContextMenuItemClicked'
    },

    initialize: function() {
      this.listenTo(Origin, 'contextMenu:empty', this.remove);
      this.render();
    },

    render: function() {
      var data = this.model.toJSON();
      var template = Handlebars.templates['contextMenuItem'];
      $(this.el).html(template(data)).appendTo('.context-menu-holder');
      return this;
    },

    onContextMenuItemClicked: function(e) {
      e && e.preventDefault();

      var eventString =
        'contextMenu' + ':' +
        this.model.get('type') + ':' +
        this.model.get('callbackEvent');

      // fire some events
      Origin.trigger('contextMenu:closeContextMenu');
      this.model.get('contextView').trigger(eventString);
    }
  });

  return ContextMenuView;
});
