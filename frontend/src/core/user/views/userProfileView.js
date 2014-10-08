define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  // var TenantSelectView = require('coreJS/tenantManagement/views/tenantSelectView');

  var UserProfileView = OriginView.extend({

    tagName: 'div',

    className: 'user-profile',

    events: {
    },

    preRender: function() {
      // console.log('in user profile');
      this.listenTo(Origin, 'userProfileSidebar:views:save', this.saveUser);
      this.listenTo(this.model, 'invalid', this.handleValidationError);
    },

    postRender: function() {
      // add the tenant selector
      // this.$('.tenant-selector').append(new TenantSelectView().$el);
      this.setViewToReady();
      // console.log('after preRender');
    },

    handleValidationError: function(model, error) {
      alert('error');
      console.log(error);
    },

    saveUser: function() {
      var self = this;

      if (this.model.isValid) {
        self.model.save({
          firstName: $('#userFirstName').val(),
          lastName: $('#userLastName').val()
        }, {
          error: function(model, response, optinos) {

          },
          success: function(model, response, options) {

          }
        });
      } 
    }


    // saveUser: function() {
    //   var self = this;

    //   self.model.save({
    //     email: $('#userEmail').val(),
    //     password: $('#userPassword').val(),
    //     _tenantId: $('#tenantSelect').val()
    //   }, {
    //     error: function(model, response, options) {
    //       alert('An error occurred during the save');
    //     },
    //     success: function(model, response, options) {
    //       Backbone.history.history.back();
    //       self.remove();
    //     }
    //   });
    // }
    
  }, {
    template: 'userProfile'
  });

  return UserProfileView;

});
