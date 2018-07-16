define([
  'backbone-forms',
  'backbone-forms-lists',
], function(BackboneForms, BackboneFormsLists) {
  'use strict';
  
  var ListItem = Backbone.Form.editors.List.Item.prototype;

  return {
    events: _.extend(ListItem.events, {
      'click .clone': 'cloneItem',
      'click .move-up': 'moveUp',
      'click .move-down': 'moveDown'
    }),

    cloneItem: function(event) {
      this.list.trigger('copyItem', this.editor);
    },
    
    moveUp: function(event) {
      this.list.trigger('moveItem', 'up', this);
    },

    moveDown: function(event) {
      this.list.trigger('moveItem', 'down', this);
    }
  }

});
