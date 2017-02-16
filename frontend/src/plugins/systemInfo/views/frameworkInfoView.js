// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var InfoView = require('./infoView.js');

  var FrameworkInfoView = InfoView.extend({
    className: 'frameworkInfo',
    route: 'framework',

    checkForUpdate: function() {
      var self = this;
      self.updateButton(window.polyglot.t('app.checking'), true);
      this.getData('latest', function(data) {
        self.model.set({
          latest: data,
          isUpdateAvailable: self.model.get('installed') !== data
        });
        self.render();
      });
    },

    updateFramework: function() {
      var self = this;
      Origin.Notify.confirm({
        type: 'warning',
        text: window.polyglot.t('app.confirmframeworkupdate'),
        destructive: true,
        callback: function(isConfirmed) {
          if(!isConfirmed) return;
          self.updateButton(window.polyglot.t('app.updating'), true);
          $.ajax(self.getRoutePrefix() + 'update', {
            method: 'PUT',
            data: { version: self.model.get('latest') },
            success: _.bind(self.onUpdateSuccess, self),
            error: _.bind(self.onUpdateError, self)
          });
        }
      });
    },

    /**
    * Events
    */

    onButtonClicked: function(event) {
      event && event.preventDefault();
      if(this.model.get('isUpdateAvailable')) this.updateFramework();
      else this.checkForUpdate();
    },

    onUpdateSuccess: function(data) {
      var newVersion = Object.values(data)[0];
      Origin.Notify.alert({
        type: 'success',
        text: window.polyglot.t('app.frameworkupdatesuccess', { version: newVersion })
      });
      this.model.set({
        installed: newVersion,
        latest: newVersion,
        isUpdateAvailable: false
      });
      this.render();
    },

    onUpdateError: function(data) {
      var self = this;
      // add a timer in case we get an error before the previous confirm has closed
      setTimeout(function() {
        Origin.Notify.alert({
          type: 'error',
          text: window.polyglot.t('app.frameworkupdateerror', { error: data.responseJSON.error })
        });
        self.render();
      }, 300);
    }
  }, {
    template: 'frameworkInfo'
  });

  return FrameworkInfoView;
});
