define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');  

  var EditView = OriginView.extend({

    className: 'profile',

    tagName: "div",

    events: {
      'click .btn-success': 'saveChanges',
      'click .btn-danger': 'cancelEdit'

    },
    preRender: function() {
     var profileModel = this.model;     
    },
    saveChanges: function(e) {
      e.preventDefault();
      var userData = {
      'fname' : $('#profileViewInputFName').val(),
      'lname' : $('#profileViewInputLName').val(),
      'location' : $('#profileViewInputLocation').val()
      };

      this.model.updateUser(userData, function(result){console.log('omg the result',result)});

      return false;
    },
    cancelEdit: function(e) {
      e.preventDefault();
     
      return false;
    },
  },

 
    
{
    template: 'profileEdit'
  }
);

  return EditView;

});
