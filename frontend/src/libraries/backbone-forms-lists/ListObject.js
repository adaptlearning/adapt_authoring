define([
  'backbone-forms',
  './ListModalView'
], function(Form, ListModalView) {
  'use strict';

  // Form.editors.List.Object
  var ListObject = ListModalView.extend({
    initialize: function () {
      ListModalView.prototype.initialize.apply(this, arguments);
      
      var schema = this.schema;
      
      if (!schema.subSchema) throw new Error('Missing required option "schema.subSchema"');
      
      this.nestedSchema = schema.subSchema;
    }
  });

  return ListObject;

});