// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function (require) {
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');

  var jsHelpers = {
    // shortcut for jQuery ajax
    ajax: function (route, data, method, success) {
      var self = this;
      $.ajax(route, {
        data: data,
        method: method,
        error: function (data, status, error) {
          var message = error + ': ';
          if (data.responseText) message += data.responseText;
          Origin.Notify.alert({ type: 'error', text: message });
        },
        success: success
      });
    }
  };

  // accessible to Handlebars only!
  var hbsHelpers = {
    ifIsCurrentTenant: function (tenantId, block) {
      if (tenantId === Origin.sessionModel.get('tenantId')) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    },

    ifUserNotMe: function (userId, block) {
      if (userId !== Origin.sessionModel.get('id')) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    },

    ifUserNotSuperAdmin: function (roleNames, block) {
      var isSuperAdmin = false;
      _.each(roleNames, function (role, index) {
        if (role == 'Super Admin') {
          isSuperAdmin = true;
        }
      });

      if (isSuperAdmin) {
        return block.inverse(this);
      } else {
        return block.fn(this);
      }
    },

    ifUserSuperAdmin: function (roleNames, block) {
      var isSuperAdmin = false;
      _.each(roleNames, function (role, index) {
        if (role == 'Super Admin') {
          isSuperAdmin = true;
        }
      });

      if (isSuperAdmin) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    }
  };

  for (var name in hbsHelpers) {
    if (hbsHelpers.hasOwnProperty(name)) Handlebars.registerHelper(name, hbsHelpers[name]);
  }

  return jsHelpers;
});
