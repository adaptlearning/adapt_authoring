// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  // don't bother doing anything if there's no storage
  if(!Storage) return;

  var _ = require('underscore');
  var Origin = require('core/origin');

  var userData = false;

  var BrowserStorage = {
    initialise: function() {
      var userId = Origin.sessionModel.get('id');
      userData = {
        local: JSON.parse(localStorage.getItem(userId)) || {},
        session: JSON.parse(sessionStorage.getItem(userId)) || {}
      };
    },

    set: function(key, value, sessionOnly, replaceExisting) {
      // determine what we're storing, and where
      var storageObj = sessionOnly ? userData.session : userData.local;
      var value = replaceExisting ? value : _.extend({}, storageObj[key], value);
      // persist data
      storageObj[key] = value;
      this.save();
    },

    get: function(key) {
      return _.extend({}, userData.local[key], userData.session[key]);
    },

    // persist data to Storage
    save: function() {
      var userId = Origin.sessionModel.get('id');

      if(!_.isEmpty(userData.session)) {
        sessionStorage.setItem(userId, JSON.stringify(userData.session));
      }
      if(!_.isEmpty(userData.local)) {
        localStorage.setItem(userId, JSON.stringify(userData.local));
      }
    }
  };

  // initialise
  Origin.on('origin:dataReady login:changed', function() {
    BrowserStorage.initialise();
    Origin.browserStorage = BrowserStorage;
  });
});
