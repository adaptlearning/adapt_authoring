// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var TagsInput = require('core/libraries/jquery.tagsinput.min');

  var AssetManagementNewAssetView = OriginView.extend({

    className: 'asset-management-upload-asset',

    events: {
      'change .asset-file': 'onChangeFile'
    },

    preRender: function() {
      this.listenTo(Origin, 'assetManagement:uploadAssets', this.uploadAssets);
    },

    postRender: function() {
      // tagging
      this.$('#tags_control').tagsInput({
        autocomplete_url: '/api/autocomplete/tag',
        onAddTag: _.bind(this.onAddTag, this),
        onRemoveTag: _.bind(this.onRemoveTag, this),
        minChars: 3,
        maxChars: 30
      });
      this.setViewToReady();
    },

    onChangeFile: function(event) {
      var $title = this.$('.asset-title');

      // Default 'title' -- remove C:\fakepath if it is added
      $title.val(this.$('.asset-file')[0].value.replace('C:\\fakepath\\', ''));
    },

    validateInput: function() {
      var reqs = this.$('.required');
      var uploadFile = this.$('.asset-file');
      var validated = true;
      var uploadFileErrormsg = $(uploadFile).prev('label').find('span.error');
      $.each(reqs, function(index, el) {
        var errormsg = $(el).prev('label').find('span.error');
        if (!$.trim($(el).val())) {
          validated = false;
          $(el).addClass('input-error');
          $(errormsg).text(window.polyglot.t('app.pleaseentervalue'));
        } else {
          $(el).removeClass('input-error');
          $(errormsg).text('');
        }
      });

      if (this.model.isNew() && !uploadFile.val()) {
        validated = false;
        $(uploadFile).addClass('input-error');
        $(uploadFileErrormsg).text(window.polyglot.t('app.pleaseaddfile'));
      } else {
        $(uploadFile).removeClass('input-error');
        $(uploadFileErrormsg).text('');
      }
      return validated;
    },

    uploadAssets: function() {

      if (!this.validateInput()) {
        Origin.trigger('sidebar:resetButtons');
        return false;
      }

      var title = this.$('.asset-title').val();
      var description = this.$('.asset-description').val();
      // TODO - we don't need a model for this so this check is irrelevant
      // If model is new then uploadFile
      if (this.model.isNew()) {
        this.uploadFile();
        // Return false to prevent the page submitting
        return false;
      }
    },

    uploadFile: function() {
      // fix tags
      var tags = [];
      _.each(this.model.get('tags'), function(item) {
        item._id && tags.push(item._id);
      });
      this.$('#tags').val(tags);

      var self = this;
      this.$('.asset-form').ajaxSubmit({

        uploadProgress: function(event, position, total, percentComplete) {
          $('.progress-container').css('visibility', 'visible');
          var percentVal = percentComplete + '%';
          $('.progress-bar').css('width', percentVal);
          $('.progress-percent').html(percentVal);
        },

        error: function(data, status, error) {
          Origin.trigger('sidebar:resetButtons');
          Origin.Notify.alert({
            type: 'error',
            text: data.responseJSON.message
          });
        },

        success: function(data, status, xhr) {
          Origin.trigger('assets:update');

          self.model.set({_id: data._id});
          self.model.fetch().done(function(data) {
            Origin.trigger('assetItemView:preview', self.model);
          });

          Origin.router.navigate('#/assetManagement', {trigger: true});
        }
      });

      // Return false to prevent the page submitting
      return false;
    },

    onAddTag: function(tag) {
      var model = this.model;
      $.ajax({
        url: '/api/content/tag',
        method: 'POST',
        data: { title: tag }
      }).done(function(data) {
        if (data && data._id) {
          var tags = model.get('tags') || [];
          tags.push({ _id: data._id, title: data.title });
          model.set({ tags: tags });
        }
      });
    },

    onRemoveTag: function(tag) {
      var tags = [];
      _.each(this.model.get('tags'), function(item) {
        if (item.title !== tag) {
          tags.push(item);
        }
      });
      this.model.set({ tags: tags });
    }

  }, {
    template: 'assetManagementUploadAssets'
  });

  return AssetManagementNewAssetView;

});
