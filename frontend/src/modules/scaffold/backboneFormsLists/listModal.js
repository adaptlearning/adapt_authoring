define([
  'core/origin',
  'backbone-forms',
  'backbone-forms-lists',
], function(Origin, BackboneForms, BackboneFormsLists) {
  'use strict';

  return {

    itemToString: function(value) {
      var createTitle = function(key) {
        var context = { key: key };
  
        return Backbone.Form.Field.prototype.createTitle.call(context);
      };
  
      value = value || {};
  
      //Pretty print the object keys and values
      var itemString = Origin.l10n.t('app.item');
      var itemsString = Origin.l10n.t('app.items');
      var parts = [];
      _.each(this.nestedSchema, function(schema, key) {
        var desc = schema.title ? schema.title : createTitle(key),
            val = value[key],
            pairs = '';
  
        if (Array.isArray(val)) {
          // print length
          val = val.length + ' ' + (val.length === 1 ? itemString : itemsString);
        } else if (typeof val === 'object') {
          // print nested name/value pairs
          for (var name in val) {
            if (val.hasOwnProperty(name)) {
              pairs += '<br>' + name + ' - ' + val[name];
            }
          }
  
          val = pairs;
        }
  
        if (_.isUndefined(val) || _.isNull(val)) val = '';
  
        // embolden key
        parts.push('<b>' + desc + '</b>: ' + val);
      });
  
      return parts.join('<br />');
    }

  }

});