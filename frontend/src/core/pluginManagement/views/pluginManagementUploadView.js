define(function(require){

  var Backbone = require('backbone');
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
      $('.loading').show();
      this.$('.plugin-form').ajaxSubmit({
        error: function(data, status, error) {
          $('.loading').hide();
          var message = 'There was an error uploading the plugin';
          if (data && data.responseJSON && data.responseJSON.error) {
            message += ":\n\n" + data.responseJSON.error;
          }

          alert(message);
        },
        success: function(data, status, xhr) {
          Origin.trigger('scaffold:updateSchemas', function() {
            $('.loading').hide();
            var pluginType = data.pluginType ? data.pluginType : '';
            Origin.router.navigate('#/pluginManagement/' + pluginType, {trigger:true});
          }, this);
        }
      });

      // Return false to prevent the page submitting
      return false;
    },

  }, {
    template: 'pluginManagementUpload'
  });

  return PluginManagementUploadView;

});
