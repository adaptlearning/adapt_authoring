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
      if(_.isEmpty(this.$('form input').val())) {
        this.$('.field-error').removeClass('display-none');
        Origin.trigger('sidebar:resetButtons');
        return false;
      }
      this.$('.field-error').addClass('display-none');
      return true;
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

      var resError = data && data.responseJSON && data.responseJSON.message;
      var resText = data && data.responseText;
      var message = resError || resText || '';

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
