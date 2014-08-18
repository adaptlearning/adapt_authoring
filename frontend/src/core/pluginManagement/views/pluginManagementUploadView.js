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
    },

    uploadFile: function() {
      var self = this;
      this.$('.plugin-form').ajaxSubmit({
        error: function(xhr, status, error) {
          // console.log('Error: ' + xhr.status);
        },
        success: function(data, status, xhr) {
          console.log('uploaded plugin', data);
          // Origin.router.navigate('#/pluginManagement', {trigger:true});
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
