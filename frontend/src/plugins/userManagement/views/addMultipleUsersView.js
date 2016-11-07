// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var MultipleUserView = require('./multipleUserView.js');

  var AddMultipleUsersView = OriginView.extend({
    tagName: 'div',
    className: 'addMultipleUsers',

    events: {
      'click .addUser': 'onAddUserClicked',
      'keyup': 'onKeyUp'
    },

    initialize: function() {
      OriginView.prototype.initialize.apply(this, arguments);
      this.model.set('defaultModel', new Backbone.Model({
        isFirst: true,
        tenants: this.model.get('globalData').allTenants,
        roles: this.model.get('globalData').allRoles
      }));
    },

    goBack: function() {
      Origin.router.navigate('#/userManagement', { trigger:true });
    },

    /**
    * Rendering functions
    */

    preRender: function() {
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.adduserstitle') });
      this.listenTo(Origin, 'userManagement:saveUsers', this.onSaveUsers);
    },

    postRender: function() {
      this.appendUserView();
      this.setViewToReady();
    },

    appendUserView: function() {
      var model = this.model.get('defaultModel');
      var lastUser = this.getValuesForUser(this.$('.user-item').last());
      if(lastUser) {
        // HACK this won't do if we introduce multiple roles/tenants
        this.model.get('defaultModel').set({
          isFirst: false,
          tenant: lastUser._tenantId,
          role: lastUser.roles[0]
        });
      }
      var muv = new MultipleUserView({ model: model });
      this.listenTo(muv, 'remove', this.onUserViewRemoved);

      this.$('.users').append(muv.$el);
    },

    /**
    * Data functions
    */

    // validates and handles errors
    validate: function(users) {
      var invalidUsers = [];
      // collect invalid email addresses
      for(var i = 0, count = users.length; i < count; i++) {
        if(!Helpers.isValidEmail(users[i].email.trim())) {
          invalidUsers.push(users[i]);
        }
      }
      // nothing to do
      if(invalidUsers.length === 0) return true;

      // display error
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({
        type: 'error',
        title: window.polyglot.t('app.validationfailed'),
        text: window.polyglot.t('app.invalidemail', { emails: this.getEmailsFromUsers(invalidUsers) })
      });

      return false;
    },

    createUsers: function(users, callback) {
      var self = this;
      var newUsers = [];
      var errors = [];
      // create users
      for(var i = 0, count = users.length; i < count; i++) {
        this.createUser(users[i], function(error, user) {
          if(error) errors.push(error);
          else newUsers.push(user);
          // not set roles for new users
          if((newUsers.length + errors.length) === users.length) {
            callback((errors.length > 0) ? errors : null, newUsers);
          }
        });
      }
    },

    createUser: function(user, callback) {
      $.post('api/user', user)
        .always(function(data, textStatus, jqXHR) {
          if(data.status && data.status !== 200) {
            return callback(new Error("Couldn't add " + user.email + ", (" + data.responseText + ")"), user);
          }
          callback(null, data);
        });
    },

    setAllUserRoles: function(users, callback) {
      var self = this;
      var successUsers = [];
      var errors = [];

      if(users.length === 0) return callback(null, []);

      for(var i = 0, count = users.length; i < count; i++) {
        this.setUserRoles(users[i], function(error, user) {
          if(error) errors.push(error);
          else successUsers.push(user);
          if((successUsers.length + errors.length) === users.length) {
            callback((errors.length > 0) ? errors : null, successUsers);
          }
        });
      }
    },

    setUserRoles: function(user, callback) {
      var self = this;
      var chosenRole = user.roles[0];
      var defaultRole = this.model.get('globalData').allRoles.at(0).get('_id');

      if(chosenRole === defaultRole) {
        return callback(null, user);
      }
      // unassign the default role
      $.post('/api/role/' + defaultRole + '/unassign/' + user._id)
        .always(function(data, textStatus, jqXHR) {
          if(data.status && data.status !== 200) {
            return callback(new Error("Couldn't unassign default role for " + user.email + ", (" + data.responseText + ")"), user);
          }
          callback(null, user);
        });
    },

    getValuesForUser: function($user) {
      if($user.length === 0 || $user.length > 1) {
        return;
      }
      return {
        email: $('.input[data-modelKey=email]', $user).val(),
        _tenantId: $('.input[data-modelKey=_tenantId]', $user).val(),
        roles: [$('.input[data-modelKey=roles]', $user).val()]
      };
    },

    getValues: function() {
      var data = [];
      var users = this.$('.user-item');
      for(var i = 0, count = users.length; i < count; i++) {
        var user = this.getValuesForUser(users[i]);
        if(user) data.push(user);
      }
      return data
    },

    getEmailsFromUsers: function(users) {
      var emails = '';
      for(var i = 0, count = users.length; i < count; i++) {
        if(users[i].email === "") {
          emails += '<em><b>[ ' + window.polyglot.t('app.blankemail') + ' ]</em></b><br/>';
        } else {
          emails += '<b>' + users[i].email + '</b><br/>';
        }
      }
      return emails;
    },

    /**
    * Event handlers
    */

    // add new view on enter
    onKeyUp: function(e) {
      if(e.keyCode === 13) this.appendUserView();
    },

    onAddUserClicked: function(e) {
      e && e.preventDefault();
      this.appendUserView();
    },

    onSaveUsers: function() {
      var self = this;
      var userData = this.getValues();

      if(!this.validate(userData)) return;

      Origin.Notify.confirm({
        text: window.polyglot.t('app.addmultipleusersconfirm', { emails: this.getEmailsFromUsers(userData) }),
        callback: function(confirmed) {
          if(confirmed) {
            self.createUsers(userData, function(createErrors, newUsers) {
              self.setAllUserRoles(newUsers, function(roleErrors, roleUsers) {
                var newUserIds = _.pluck(newUsers, 'email');
                var failedUsers = _.filter(userData, function(item) { return !_.contains(newUserIds, item.email) });
                var createdUsers = _.difference(newUsers, roleUsers);
                // TODO localise these
                var msg = '';
                if(roleUsers.length > 0) {
                  msg += 'The following users were created successfully:<br/>' + self.getEmailsFromUsers(roleUsers) + '<br/>';
                }
                if(createdUsers.length > 0) {
                  msg += 'Created, but could not set the role of the following users:<br/>' + self.getEmailsFromUsers(createdUsers) + '<br/>';
                }
                if(failedUsers.length > 0) {
                  msg += 'Failed to create the following users:<br/>' + self.getEmailsFromUsers(failedUsers) + '<br/>';
                }
                if(createErrors || roleErrors) {
                  msg += [].concat(createErrors, roleErrors).join(',<br/>');
                  if(newUsers.length === 0) {
                    Origin.trigger('sidebar:resetButtons');
                    Origin.Notify.alert({ type: 'error', text: msg });
                    return;
                  }
                }
                Origin.Notify.alert({ type: 'info', text: msg });
                self.goBack();
              });
            });
          }
          else {
            Origin.trigger('sidebar:resetButtons');
          }
        }
      });

      return false;
    },

    onErrors: function(type, errors) {
      console.log('onErrors:', type, errors);
      // TODO delete partially created users (mind the error isn't DuplicateUserError)
      var msg = '';
      for(var i = 0, count = errors.length; i < count; i++) {
        msg += errors[i] + '<br/>';
      }
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({
        type: type,
        text: msg
      });
    }
  }, {
    template: 'addMultipleUsers'
  });

  return AddMultipleUsersView;
});
