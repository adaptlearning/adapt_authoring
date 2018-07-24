define([
  'core/origin',
  'backbone-forms',
], function(Origin, BackboneForms) {
  'use strict';

  var initialize = Backbone.Form.editors.Base.prototype.initialize;

  return {
    // use default from schema and set up isDefaultValue toggler
    initialize: function(options) {
      var schemaDefault = options.schema.default;
    
      if (schemaDefault !== undefined) {
        this.defaultValue = schemaDefault;
      }
    
      this.listenTo(this, 'change', function() {
        if (this.hasNestedForm) return;
    
        var isDefaultValue = _.isEqual(this.getValue(), this.defaultValue);
    
        this.form.$('[data-editor-id="' + this.id + '"]')
          .toggleClass('is-default-value', isDefaultValue);
      });
    
      initialize.call(this, options);
    }
  }

});
