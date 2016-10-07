// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');
  var TagsInput = require('core/libraries/jquery.tagsinput.min');

  var AssetManagementNewAssetView = OriginView.extend({
    className: 'asset-management-new-asset',

    events: {
      'change .asset-file': 'onChangeFile',
      'click a.workspaces': 'onWorkspacesClicked'
    },

    preRender: function() {
      this.listenTo(Origin, 'assetManagement:newAsset', this.onNewAsset);
    },

    postRender: function() {
      this.initTags();
      this.setViewToReady();
    },

    initTags: function() {
      this.$('#tags_control').tagsInput({
        autocomplete_url: '/api/autocomplete/tag',
        onAddTag: _.bind(this.onAddTag, this),
        onRemoveTag: _.bind(this.onRemoveTag, this),
        'minChars' : 3,
        'maxChars' : 30
      });
    },

    validateInput: function () {
      var reqs = this.$('.required');
      var uploadFile = this.$('.asset-file');
      var validated = true;
      var uploadFileErrormsg = $(uploadFile).prev('label').find('span.error');
      $.each(reqs, function (index, el) {
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

    uploadFile: function() {
      // set tags value
      this.$('#tags').val(this.getTags());
      // set workspaces value
      this.$('#workspaces').val(JSON.stringify(this.getWorkspaces()));

      this.$('.asset-form').ajaxSubmit({
        uploadProgress: function(event, position, total, percentComplete) {
          $(".progress-container").css("visibility", "visible");
          var percentVal = percentComplete + '%';
          $(".progress-bar").css("width", percentVal);
          $('.progress-percent').html(percentVal);
        },
        error: _.bind(this.onFileUploadError, this),
        success: _.bind(this.onFileUploadSuccess, this)
      });

      // Return false to prevent the page submitting
      return false;
    },

    getTags: function() {
      return _.pluck(this.model.get('tags'), '_id');
    },

    getWorkspaces: function() {
      var selected = this.getSelectedWorkspaces();
      var generated = this.generateWorkspaces();
      return _.extend(selected, generated);
    },

    // TODO assumptions made about editor data here...
    generateWorkspaces: function() {
      if(Origin.location.module !== 'editor') {
        return {};
      }

      var courseId = Origin.location.route1;

      var contentTypes = [ 'component', 'block', 'article', 'page' ];
      var contentCollections = [ 'components', 'blocks', 'articles', 'contentObjects' ];

      var workspaces = { course: courseId };
      var id = Origin.location.route3;

      // note we start at the right point in the hierarchy
      // route2 === content type
      for(var i = _.indexOf(contentTypes, Origin.location.route2), count = contentTypes.length; i < count; i++) {
        if(!id) return; // something's gone wrong

        workspaces[contentTypes[i]] = [id];

        var match = Origin.editor.data[contentCollections[i]].findWhere({ _id: id });
        id = match.get('_parentId') || false;
      }

      return workspaces;
    },

    getSelectedWorkspaces: function() {
      return {
        course: _.pluck(this.$('.courses input:checked'), 'id')
      };
    },

    onNewAsset: function() {
      if (!this.validateInput()) {
        Origin.trigger('sidebar:resetButtons');
        return false;
      }
      // If model is new then uploadFile
      if (this.model.isNew()) {
        this.uploadFile();
        // Return false to prevent the page submitting
        return false;
      } else {
        this.model.set({
          title: this.$('.asset-title').val(),
          description: this.$('.asset-description').val(),
          workspaces: this.getWorkspaces()
        });
        this.model.save(null, {
          error: _.bind(this.onNewAssetSaveError, this),
          success: _.bind(this.onNewAssetSaveSuccess, this)
        });
      }
    },

    onNewAssetSaveSuccess: function() {
      Origin.router.navigate('#/assetManagement', {trigger:true});
    },

    onNewAssetSaveError: function() {
      Origin.Notify.alert({
        type: 'error',
        text: window.polyglot.t('app.errorassetupdate')
      });
    },

    onFileUploadSuccess: function(data, status, xhr) {
      Origin.trigger('assets:update');
      this.model.set({_id: data._id});
      this.model.fetch().done(function (data) {
        Origin.trigger('assetItemView:preview', this.model);
      });
      Origin.router.navigate('#/assetManagement', { trigger:true });
    },

    onFileUploadError: function(xhr, status, error) {
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({
        type: 'error',
        text: xhr.responseJSON.message
      });
    },

    onChangeFile: function(event) {
      var $title = this.$('.asset-title');
      // Default 'title' -- remove C:\fakepath if it is added
      $title.val(this.$('.asset-file')[0].value.replace("C:\\fakepath\\", ""));
    },

    onAddTag: function (tag) {
      var model = this.model;
      $.ajax({
        url: '/api/content/tag',
        method: 'POST',
        data: { title: tag }
      }).done(function (data) {
        if (data && data._id) {
          var tags = model.get('tags') || [];
          tags.push({ _id: data._id, title: data.title });
          model.set({ tags: tags });
        }
      });
    },

    onRemoveTag: function (tag) {
      var tags = _.filter(this.model.get('tags'), function (item) { return item.title !== tag; });
      this.model.set('tags', tags);
    },

    onWorkspacesClicked: function(e) {
      e && e.preventDefault();
      this.$('.courses').slideToggle(100);
    }
  }, {
    template: 'assetManagementNewAsset'
  });

  return AssetManagementNewAssetView;
});
