define([
  'core/origin',
  'backbone-forms',
], function(Origin, BackboneForms) {
  'use strict';

  return {
    // add override to allow prevention of validation
    validate: function(options) {
      var self = this,
          fields = this.fields,
          model = this.model,
          errors = {};
    
      options = options || {};
    
      //Collect errors from schema validation
      // passing in validate: false will stop validation of the backbone forms validators
      if (!options.skipModelValidate) {
        _.each(fields, function(field) {
          var error = field.validate();
    
          if (!error) return;
    
          var title = field.schema.title;
    
          if (title) {
              error.title = title;
          }
    
          errors[field.key] = error;
        });
      }
    
      //Get errors from default Backbone model validator
      if (!options.skipModelValidate && model && model.validate) {
        var modelErrors = model.validate(this.getValue());
    
        if (modelErrors) {
          var isDictionary = _.isObject(modelErrors) && !_.isArray(modelErrors);
    
          //If errors are not in object form then just store on the error object
          if (!isDictionary) {
            errors._others = errors._others || [];
            errors._others.push(modelErrors);
          }
    
          //Merge programmatic errors (requires model.validate() to return an object e.g. { fieldKey: 'error' })
          if (isDictionary) {
            _.each(modelErrors, function(val, key) {
              //Set error on field if there isn't one already
              if (fields[key] && !errors[key]) {
                fields[key].setError(val);
                errors[key] = val;
              }
    
              else {
                //Otherwise add to '_others' key
                errors._others = errors._others || [];
                var tmpErr = {};
                tmpErr[key] = val;
                errors._others.push(tmpErr);
              }
            });
          }
        }
      }
    
      return _.isEmpty(errors) ? null : errors;
    }
  }

});
