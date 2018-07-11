define([
  'backbone-forms',
  './ListModalView'
], function(Form, ListModalView) {
  'use strict';
  
  // Form.editors.List.NestedModel = Form.editors.List.Modal.extend({
  var ListNestedModel = ListModalView.extend({
    initialize: function() {
      ListModalView.prototype.initialize.apply(this, arguments);

      var schema = this.schema;

      if (!schema.model) throw new Error('Missing required option "schema.model"');

      var nestedSchema = schema.model.prototype.schema;

      this.nestedSchema = (_.isFunction(nestedSchema)) ? nestedSchema() : nestedSchema;
    },

    /**
     * Returns the string representation of the object value
     */
    getStringValue: function() {
      var schema = this.schema,
          value = this.getValue();

      if (_.isEmpty(value)) return null;

      //If there's a specified toString use that
      if (schema.itemToString) return schema.itemToString(value);

      //Otherwise use the model
      return new (schema.model)(value).toString();
    }
  });

  return;

});