// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ContextMenuItemView = require('./contextMenuItemView');

  var ContextMenuView = Backbone.View.extend({
    className: 'context-menu',
    contextView : {},

    events: {
      'click .context-menu-close':'onCloseContextMenu'
    },

    initialize: function() {
      this._isVisible = false;
      this.listenTo(Origin, {
        'contextMenu:open': this.toggleMenu,
        'contextMenu:closeContextMenu remove remove:views': this.hideMenu
      });
      this.render();
    },

    render: function() {
      var template = Handlebars.templates['contextMenu'];
      $(this.el).html(template).appendTo('body');
      return this;
    },

    renderItems: function() {
      this.$('.context-menu-holder').empty();
      Origin.trigger('contextMenu:empty');

      _.each(this.collection.where({ type: this.type }), function(item) {
        item.set('contextView', this.contextView);
        new ContextMenuItemView({ model: item });
      }, this);
    },

    toggleMenu: function(view, e) {
      if(this._isVisible) {
        return this.hideMenu();
      }
      this.setMenu(view, $(e.currentTarget));
      this.showMenu();
    },

    setMenu: function(view, $parent) {
      this.contextView = view;

      var type = view.model.get('_type');
      if (type === 'course' && !view.model.isEditable()) type = 'sharedcourse';
      this.type = type;

      this.renderItems();

      this.$el.css({
        position: 'absolute',
        left: $parent.offset().left + $parent.width() + 10,
        top: $parent.offset().top - ($parent.height()/2)
      });
    },

    showMenu: function() {
      this.$el.removeClass('display-none');
      this._isVisible = true;
      this.addBodyEvent();
      Origin.trigger('contextMenu:opened');
    },

    hideMenu: function() {
      this.$el.addClass('display-none');
      this._isVisible = false;
      this.removeBodyEvent();
      Origin.trigger('contextMenu:closed');
    },

    addBodyEvent: function() {
      $('html').one('click', _.bind(this.hideMenu, this));
    },

    removeBodyEvent: function() {
      $('html').off('click');
    }
  });

  return ContextMenuView;
});
