define([
  'core/origin',
  'backbone-forms',
], function(Origin, BackboneForms) {
  'use strict';
  
  var templateData = Backbone.Form.Field.prototype.templateData;

  return {
    // add reset to default handler
    events: {
      'click [data-action="default"]': function() {
        this.setValue(this.editor.defaultValue);
        this.editor.trigger('change', this);

        return false;
      }
    },

    // merge schema into data
    templateData: function() {
      return _.extend(templateData.call(this), this.schema, {
        isDefaultValue: _.isEqual(this.editor.value, this.editor.defaultValue)
      });
    }
  }

});
