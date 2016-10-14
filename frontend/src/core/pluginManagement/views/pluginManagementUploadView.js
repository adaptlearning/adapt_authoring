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
      'change .plugin-file': 'onFileSelected',
      'dragenter label[for=file]': 'onDrag',
      'dragover label[for=file]': 'onDrag',
      'dragleave label[for=file]': 'onDrop',
      'dragend label[for=file]': 'onDrop',
      'drop label[for=file]': 'onDrop'
    },

    preRender: function() {
      Origin.trigger('location:title:update', {title: window.polyglot.t('app.uploadplugin')});
      this.listenTo(Origin, 'pluginManagement:uploadPlugin', this.uploadFile);
    },

    postRender: function() {
      // TODO get rid of this
      _.defer(this.setViewToReady);
    },

    uploadFile: function() {
      if(this.validate()) {
        $('.loading').show();
        this.$('.plugin-form').ajaxSubmit({
          error: _.bind(this.onSubmitError, this),
          success: _.bind(this.onSubmitSuccess, this)
        });
      }
      // to prevent the page submitting
      return false;
    },

    validate: function() {
      if(_.isEmpty(this.$('form input').val())) {
        Origin.trigger('sidebar:resetButtons');
        this.$('label[for=file]').addClass('validation-error');
        return false;
      }
      this.$('label[for=file]').removeClass('validation-error');
      return true;
    },

    /*
    * Events
    */

    onDrag: function(e) {
      e && e.preventDefault();
      e && e.stopPropagation();
      this.$('label[for=file]').addClass('over');
    },

    onDrop: function(e) {
      e && e.preventDefault();
      e && e.stopPropagation();
      this.$('label[for=file]').removeClass('over');
      if(e.type === 'drop') {
        var files = e.originalEvent.dataTransfer.files;
        this.$('input[id=file]').prop('files', files);
      }
    },

    onFileSelected: function(event) {
      // Default 'title' -- remove C:\fakepath if it is added
      var title = this.$('.plugin-file')[0].value.replace("C:\\fakepath\\", "");
      // change upload button label
      this.$('label[for=file] .btn-label').html(title);
      this.$('label[for=file]').removeClass('validation-error').addClass('selected');
      // set title field if empty
      var $title = this.$('.asset-title');
      if(_.isEmpty($title.val())) $title.val(title);
    },

    onSubmitSuccess: function(data, status, xhr) {
      Origin.trigger('scaffold:updateSchemas', function() {
        $('.loading').hide();
        Origin.Notify.alert({
          type: 'success',
          text: window.polyglot.t('app.uploadpluginsuccess')
        });
        Origin.router.navigate('#/pluginManagement/' + (data.pluginType || ''), { trigger:true });
      }, this);
    },

    onSubmitError: function(data, status, error) {
      $('.loading').hide();

      var message = '';
      if (data) {
        if (data.responseText) {
          message = data.responseText;
        }
        else if(data.responseJSON && data.responseJSON.error) {
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
    }
  }, {
    template: 'pluginManagementUpload'
  });

  return PluginManagementUploadView;
});
