// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');

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

    onContextMenuItemClicked: function(event) {
      event && event.preventDefault();

      var callbackEvent = this.model.get('callbackEvent');
      this.model.get('contextView').trigger('contextMenu:' + this.model.get('type') + ':' + callbackEvent);

      Origin.trigger('contextMenu:closeContextMenu');
    }
  });

  return ContextMenuItemView;
});
