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
      console.log('in user profile');
      // this.listenTo(Origin, 'userEditSidebar:views:save', this.saveUser);
    },

    postRender: function() {
      // add the tenant selector
      // this.$('.tenant-selector').append(new TenantSelectView().$el);
      this.setViewToReady();
      console.log('after preRender');
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
