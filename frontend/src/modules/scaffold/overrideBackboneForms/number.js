define([
  'core/origin',
  'backbone-forms',
], function(Origin, BackboneForms) {
  'use strict';

  return {
    // allow hyphen to be typed in number fields
    onKeyPress: function(event) {
      var self = this,
        delayedDetermineChange = function() {
          setTimeout(function() {
          self.determineChange();
        }, 0);
      };
    
      //Allow backspace
      if (event.charCode === 0) {
        delayedDetermineChange();
        return;
      }
    
      //Get the whole new value so that we can prevent things like double decimals points etc.
      var newVal = this.$el.val()
      if( event.charCode != undefined ) {
        newVal = newVal + String.fromCharCode(event.charCode);
      }
    
      var numeric = /^-?[0-9]*\.?[0-9]*?$/.test(newVal);
    
      if (numeric) {
        delayedDetermineChange();
      }
      else {
        event.preventDefault();
      }
    }
  }

});
