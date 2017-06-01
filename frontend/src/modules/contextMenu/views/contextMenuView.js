// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ContextMenuItemView = require('./contextMenuItemView');

  var ContextMenuView = Backbone.View.extend({
    className: 'context-menu',
    contextView : {},

    initialize: function() {
      this._isVisible = false;
      this.listenTo(Origin, {
        'contextMenu:open': this.toggleMenu,
        'contextMenu:closeContextMenu remove remove:views': this.hideMenu
      });
      $('html').click(_.bind(this.hideMenu, this));
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
      var isSameType = view && (view.model.get('_type')) === (this.contextView.model && this.contextView.model.get('_type'));
      var isSameModel = view && (view.model.get('_id')) === (this.contextView.model && this.contextView.model.get('_id'));
      var isSameView = view.cid === this.contextView.cid; // to make sure we don't break listeners
      // new view, update the menu items
      if(!isSameType || !isSameModel || !isSameView) {
        this.setMenu(view, $(e.currentTarget));
        return this.showMenu();
      }
      (this._isVisible) ? this.hideMenu() : this.showMenu();
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
      Origin.trigger('contextMenu:opened');
    },

    hideMenu: function() {
      this.$el.addClass('display-none');
      this._isVisible = false;
      Origin.trigger('contextMenu:closed');
    },
  });

  return ContextMenuView;
});
