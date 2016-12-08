// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var UserCollection = require('../collections/userCollection.js');

  var AddUserView = OriginView.extend({
    tagName: 'div',
    className: 'addUser',
    createdUserId: false,
    settings: {
      autoRender: false
    },
    users: new UserCollection(),

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);

      Origin.trigger('location:title:update', { title: window.polyglot.t('app.addusertitle') });
      this.initData();
    },

    initData: function() {
      this.listenTo(Origin, 'userManagement:saveUser', this.saveNewUser);
      this.listenTo(this.users, 'sync', this.onUsersFetched);
      this.users.fetch();
    },

    render:function(){
      OriginView.prototype.render.apply(this, arguments);
    },

    postRender: function() {
      this.setViewToReady();
    },

    isValid: function() {
      var email = this.$('input[name=email]').val().trim();
      var valid = Helpers.isValidEmail(email);
      if(valid) {
        this.$('.field-error').addClass('display-none');
      } else {
        this.$('.field-error').removeClass('display-none');
        Origin.Notify.alert({
          type: 'error',
          title: window.polyglot.t('app.validationfailed'),
          text: window.polyglot.t('app.invalidusernameoremail')
        });
      }
      return valid;
    },

    saveNewUser: function() {
      if(!this.isValid()) {
        return;
      }
      // submit form data
      this.$('form.addUser').ajaxSubmit({
        error: _.bind(this.onAjaxError, this),
        success: _.bind(this.onFormSubmitSuccess, this)
      });

      return false;
    },

    goBack: function() {
      Origin.router.navigate('#/userManagement', { trigger:true });
    },

    onFormSubmitSuccess: function(userData, userStatus, userXhr) {
      this.createdUserId = userData._id;

      var self = this;
      var chosenRole = $('form.addUser select[name=role]').val();
      var defaultRole = userData.roles[0];

      if(chosenRole !== defaultRole) {
        // unassign the default role
        $.ajax('/api/role/' + defaultRole + '/unassign/' + userData._id,{
          method: 'POST',
          error: _.bind(self.onAjaxError, self),
          success: function() {
            // assign chosen role
            $.ajax('/api/role/' + chosenRole + '/assign/' + userData._id,{
              method: 'POST',
              error: _.bind(self.onAjaxError, self),
              success: _.bind(self.onAjaxSuccess, self)
            });
          }
        });
      } else {
        this.onAjaxSuccess();
      }
    },

    onAjaxSuccess: function() {
      this.goBack();
    },

    onAjaxError: function(data, status, error) {
      // We may have a partially created user, make sure it's gone
      if(this.createdUserId) {
        $.ajax('/api/user/' + this.createdUserId, { method: 'DELETE', error: _.bind(this.onAjaxError, this) });
      }
      Origin.Notify.alert({
        type: 'error',
        title: "Couldn't add user",
        text: data.responseText || error
      });
    },

    isCurrentUserTenantAdmin:function(){
     var currentUserId = Origin.sessionModel.get('id');
     var isTenantadmin = false;

     this.currentUser = _.find(this.users.models, function(user) {
      return user.get('_id') === currentUserId;
    });

     if(this.currentUser){
      //ASSUMPTION:user always have one and only role
      var currentUserRole = this.currentUser.get('roles')[0];
      if(currentUserRole.name === 'Tenant Admin'){
        isTenantadmin = this.currentUser;
        this.model.set('tenantAdmin',isTenantadmin);
      }
    }
  },

  onUsersFetched:function(models, reponse, options){
    this.isCurrentUserTenantAdmin();
    this.render();
  }

}, {
  template: 'addUser'
});

  return AddUserView;
});
