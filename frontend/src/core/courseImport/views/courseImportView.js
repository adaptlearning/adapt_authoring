// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var CourseImportView = OriginView.extend({
    tagName: 'div',
    className: 'courseImport',

    preRender: function() {
      //events
      Origin.on('courseImport:import', this.submit, this);

      Origin.trigger('location:title:update', {title: window.polyglot.t('app.importsidebartitle')});
    },

    postRender: function() {
      this.setViewToReady();
    },

    submit: function() {
      // HACK in case the browser file filter doesn't work
      // (FF, I'm looking at you - https://bugzilla.mozilla.org/show_bug.cgi?id=826176)
      var isZip = this.$('.import-form input[type="file"]').val().search(/.(?:\.zip$)/) > -1;
      if(!isZip) {
        return this.showError();
      } else {
        this.hideError();
      }

      // TODO localise notify strings
      this.$('.import-form').ajaxSubmit({
        error: function(data, status, error) {
          Origin.Notify.alert({
            type: 'error',
            title: 'Import error',
            text: data.responseJSON && data.responseJSON.message || data.statusText
          });
          Origin.router.navigate('#/dashboard', { trigger: true });
        },
        success: function(data, status, xhr) {
          Origin.Notify.alert({
            type: 'success',
            title: 'Import successful',
            text: data.message
          });
          Origin.router.navigate('#/dashboard', { trigger: true });
        }
      });

      return false;
    },

    showError: function(errorText) {
      this.$('.import-form .error').removeClass('display-none');
    },
    hideError: function(errorText) {
      this.$('.import-form .error').addClass('display-none');
    }
  }, {
    template: 'courseImport'
  });

  return CourseImportView;
});
