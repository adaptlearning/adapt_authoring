// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * TODO Look into setting this up like Notify with registered plugins 
 */
define(function(require) {
  // don't bother doing anything if there's no storage
  if(!Storage) return;
  
  var _ = require('underscore');
  var Origin = require('coreJS/app/origin');

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
      // TODO messy & only handles objects
      if(sessionOnly === true) {
        if(replaceExisting) userData.session[key] = value;
        else userData.session[key] = _.extend({}, userData.session[key], value);
      } else {
        if(replaceExisting) userData.local[key] = value;
        else userData.local[key] = _.extend({}, userData.local[key], value);
      }
      this.save();
    },

    get: function(key) {
      var value = _.extend({}, userData.local[key], userData.session[key]);
      return value;
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

  // init
  Origin.on('app:dataReady login:changed', function() {
    BrowserStorage.initialise();
    Origin.browserStorage = BrowserStorage;
  });
});
