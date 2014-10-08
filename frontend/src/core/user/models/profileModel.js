define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');


  var ProfileModel = Backbone.Model.extend({

    defaults: {
      id: -1,
      email: '',
      auth: '',
      password: '',
      tenant: '',
      active: false
    },

    initialize: function() {
      // var profileModel = this;
      // $.get('/api/user/me',function (res) {
      //   profileModel.attributes['id'] = res._id;
      //   profileModel.attributes['email'] = res.email;             
      // });      
    },

    url: function () {
      //@todo : swap this to the correct url
      return "/api/user/me";
    },

    updateUser: function (updatedUserData, cback) {
      var model = this;      

      $.post(
        '/api/user/me',
        {                   
          'fname':updatedUserData['fname'],
          'lname':updatedUserData['lname'],
          'location':updatedUserData['location']
          
        },
        function(result) {
          cback(false, result);
        }
      );
    }

  });

  return ProfileModel;

})