// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var BackboneForms = require('backbone-forms');
  var Origin = require('core/origin');

  var TextAreaBlankView = Backbone.Form.editors.TextArea.extend({
    render: function() {
      // Place value
      this.setValue(this.value);
      return this;
    },

    getValue: function() {
      return this.$el.val();
    }
  });

  Origin.on('origin:dataReady', function() {
    // Add Image editor to the list of editors
    Origin.scaffold.addCustomField('TextArea:blank', TextAreaBlankView);
  });

  return TextAreaBlankView;
});
