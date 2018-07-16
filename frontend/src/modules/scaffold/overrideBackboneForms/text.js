define([
  'core/origin',
  'backbone-forms',
], function(Origin, BackboneForms) {
  'use strict';

  var textInitialize = Backbone.Form.editors.Text.prototype.initialize;

  return {
    // disable automatic completion on text fields if not specified
    initialize: function(options) {
      textInitialize.call(this, options);
    
      if (!this.$el.attr('autocomplete')) {
        this.$el.attr('autocomplete', 'off');
      }
    }
  }

});
