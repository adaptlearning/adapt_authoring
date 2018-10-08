// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');

  var PluginManagementUploadView = OriginView.extend({
    className: 'pluginManagement-upload-plugin',

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.uploadplugin') });
      this.listenTo(Origin, 'pluginManagement:uploadPlugin', this.uploadFile);
    },

    postRender: function() {
      _.defer(this.setViewToReady);
    },

    uploadFile: function() {
      if(this.validate()) {
        $('.loading').show();
        this.$('.plugin-form').ajaxSubmit({
          success: this.onUploadSuccess,
          error: this.onUploadError
        });
      }
      // Return false to prevent the page submitting
      return false;
    },

    validate: function() {
      var inputField = this.$('form input');
      var isValid = true;
      var message = '';

      if (_.isEmpty(inputField.val())) {
        isValid = false;
        message = Origin.l10n.t('app.required');
      }

      if (inputField[0].files[0] && inputField[0].files[0].size > Origin.constants.maxFileUploadSize) {
        isValid = false;
        message = Origin.l10n.t('app.assetfilesizeexceeded', {
          uploadLimit: Origin.constants.humanMaxFileUploadSize
        });
      }

      if (isValid) {
        this.$('.field-error').addClass('display-none');
        return true;
      } else {
        this.$('.field-error').text(message).removeClass('display-none');
        Origin.trigger('sidebar:resetButtons');
        return false;
      }
    },

    onUploadSuccess: function(data) {
      Origin.trigger('scaffold:updateSchemas', function() {
        Origin.Notify.alert({ type: 'success', text: Origin.l10n.t('app.uploadpluginsuccess') });

        Origin.trigger('sidebar:resetButtons');
        $('.loading').hide();

        Origin.router.navigateTo('pluginManagement/' + (data.pluginType || ''));
      }, this);
    },

    onUploadError: function(data) {
      Origin.trigger('sidebar:resetButtons');
      $('.loading').hide();

      var message = '';
      var hasText = data && data.responseText;
      var hasError = data && data.responseJSON && data.responseJSON.error;

      if(hasText) message = data.responseText;
      else if(hasError) message = data.responseJSON.error;

      Origin.Notify.alert({
        type: 'error',
        title: Origin.l10n.t('app.uploadpluginerror'),
        text: Helpers.decodeHTML(message)
      });

      Origin.router.navigateTo('pluginManagement/upload');
    },
  }, {
    template: 'pluginManagementUpload'
  });

  return PluginManagementUploadView;
});
