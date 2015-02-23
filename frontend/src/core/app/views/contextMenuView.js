/*
* ContextMenu
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ContextMenuView = Backbone.View.extend({

    className: 'context-menu',

    contextView : {},

    initialize: function() {
      this._isVisible = false;
      this.listenTo(Origin, 'contextMenu:open', function(view, e) {
        this.contextView = view;
        var type = view.model.get('_type');

        if (type == 'course') {
          if (view.model.isShared()) {
            type = 'sharedcourse';
          }
        } 

        this.toggleContextMenu(type, e);
      });
      this.listenTo(Origin, 'contextMenu:closeContextMenu', this.onCloseContextMenu);
      this.listenTo(Origin, 'remove', this.onCloseContextMenu);
      this.render();
    },

    events: {
      'click .context-menu-close':'onCloseContextMenu'
    },

    render: function() {
      var template = Handlebars.templates['contextMenu'];
      $(this.el).html(template).appendTo('body');
      return this;
    },

    onCloseContextMenu: function(event) {
      if (event) {
        event.preventDefault();
      }
      this._isVisible = false;
      this.hideContextMenu();
    },

    toggleContextMenu: function(type, e) {
      this.type = type;
      if (this._isVisible) {
        this._isVisible = false;
        this.hideContextMenu();
      } else {
        this._isVisible = true;
        this.showContextMenu(true, e);
      }
    },

    showContextMenu: function(emptyContextMenu, e) {
      var contextMenuWidth = this.$el.width();
      if (emptyContextMenu) {
        this.emptyContextMenu();
        this.renderItems();
        Origin.trigger('contextMenu:openedItemView');
      }
      _.defer(_.bind(function() {
        this.$el.css({position: 'absolute',
          left: $(e.currentTarget).offset().left + $(e.currentTarget).width() + 10,
          top: $(e.currentTarget).offset().top})
        .removeClass('display-none');
      
        this.addBodyEvent();
        Origin.trigger('contextMenu:opened');
      }, this));
    },

    emptyContextMenu: function() {
      this.$('.context-menu-holder').empty();
    },

    renderItems: function() {
      Origin.trigger('contextMenu:empty');
      this.emptyContextMenu();
      var contextView = this.contextView;
      var filtered = this.collection.where({type:this.type});
      _.each(filtered, function(item) {
        item.set('contextView', contextView);
        new ContextMenuItemView({model: item});
      });
    },

    hideContextMenu: function() {
      this.$el.addClass('display-none');
      this.removeBodyEvent();
      Origin.trigger('contextMenu:closed');
    },

    addBodyEvent: function() {
      $('html').one('click', _.bind(function() {
        this.onCloseContextMenu();
      }, this));
    },

    removeBodyEvent: function() {
      $('html').off('click');
    }

  });

  var ContextMenuItemView = Backbone.View.extend({

    className: 'context-menu-item',

    initialize: function() {
      this.listenTo(Origin, 'contextMenu:empty', this.remove);
      this.render();
    },

    events: {
      'click .context-menu-item-open': 'onContextMenuItemClicked'
    },

    render: function() {
      var data = this.model.toJSON();
      var template = Handlebars.templates['contextMenuItem'];
      $(this.el).html(template(data)).appendTo('.context-menu-holder');
      return this;
    },

    onContextMenuItemClicked: function(event) {
      event.preventDefault();
      
      var callbackEvent = this.model.get('callbackEvent');
      this.model.get('contextView').trigger('contextMenu:' + this.model.get('type') + ':' + callbackEvent);

      Origin.trigger('contextMenu:closeContextMenu');
    }

  });

  return ContextMenuView;

});
