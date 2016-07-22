// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Helpers = require('coreJS/app/helpers');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var TagsInput = require('core/libraries/jquery.tagsinput.min');

  var PluginManagementUploadView = OriginView.extend({

    className: 'pluginManagement-upload-plugin',

    events: {
    },

    preRender: function() {
      Origin.trigger('location:title:update', {title: window.polyglot.t('app.uploadplugin')});
      this.listenTo(Origin, 'pluginManagement:uploadPlugin', this.uploadFile);
    },

    postRender: function() {
      _.defer(this.setViewToReady);
    },

    uploadFile: function() {
      var self = this;
      
      if(this.validate()) {
        $('.loading').show();
        this.$('.plugin-form').ajaxSubmit({
          error: function(data, status, error) {
            $('.loading').hide();

            var message = '';
            if (data) {
              if (data.responseText) {
                message = data.responseText;
              } else if(data.responseJSON && data.responseJSON.error) {
                message = data.responseJSON.error;
              }
            }
            Origin.Notify.alert({
              type: 'error',
              title: window.polyglot.t('app.uploadpluginerror'),
              text: Helpers.decodeHTML(message)
            });

            // go back to the upload, maybe handle this in the sidebar?
            Origin.router.navigate('#/pluginManagement/upload', { trigger: true });
          },
          success: function(data, status, xhr) {
            Origin.trigger('scaffold:updateSchemas', function() {
              Origin.Notify.alert({
                type: 'success',
                text: window.polyglot.t('app.uploadpluginsuccess')
              });

              $('.loading').hide();
              var pluginType = data.pluginType ? data.pluginType : '';
              Origin.router.navigate('#/pluginManagement/' + pluginType, {trigger:true});
            }, this);
          }
        });
      }

      // Return false to prevent the page submitting
      return false;
    },

    validate: function() {
      var file = this.$('form input').val();

      if(_.isEmpty(file)) {
        this.$('.field-error').removeClass('display-none');
        Origin.trigger('sidebar:resetButtons');

        return false;
      }

      this.$('.field-error').addClass('display-none');

      return true;
    }

  }, {
    template: 'pluginManagementUpload'
  });

  return PluginManagementUploadView;

});
