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
      'change .asset-file': 'onFileSelected',
      'click a.workspaces': 'onWorkspacesClicked',

      'dragenter label[for=file]': 'onDrag',
      'dragover label[for=file]': 'onDrag',
      'dragleave label[for=file]': 'onDrop',
      'dragend label[for=file]': 'onDrop',
      'drop label[for=file]': 'onDrop'
    },

    preRender: function() {
      this.listenTo(Origin, 'assetManagement:newAsset', this.uploadData);
    },

    postRender: function() {
      this.initTags();
      this.setHeight();
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

    setHeight: function () {
      var newHeight = $(window).height()-$('.'+this.className).offset().top;
      $('.'+this.className).height(newHeight);
    },

    validate: function () {
      var $uploadFile = this.$('.asset-file');
      var validated = true;
      var uploadFileErrormsg = $uploadFile.prev('label').find('span.error');
      // check required fields
      $('.required').each(function (index, el) {
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
      // check upload file
      if (this.model.isNew() && !$uploadFile.val()) {
        validated = false;
        $uploadFile.addClass('input-error');
        $(uploadFileErrormsg).text(window.polyglot.t('app.pleaseaddfile'));
      } else {
        $uploadFile.removeClass('input-error');
        $(uploadFileErrormsg).text('');
      }

      return validated;
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
      var contentTypes = [ 'component', 'block', 'article', 'contentobject' ];
      var contentCollections = [ 'components', 'blocks', 'articles', 'contentObjects' ];

      var workspaces = { course: [ Origin.location.route1 ] };
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

    uploadData: function() {
      if (!this.validate()) {
        Origin.trigger('sidebar:resetButtons');
        return false;
      }
      var isNew = this.model.isNew();

      this.$('#tags').val(this.getTags());
      this.$('#workspaces').val(JSON.stringify(this.getWorkspaces()));

      this.$('.asset-form').ajaxSubmit({
        url: '/api/asset/' + (isNew ? '' : this.model.get('_id')),
        method: (isNew ? 'post' : 'put'),
        uploadProgress: _.bind(function(event, position, total, percentComplete) {
          this.$('label[for=file] .label').hide();
          var $progress = this.$('label[for=file] .progress').removeClass('display-none');
          $(".value", $progress).html(percentComplete);
        }, this),
        error: _.bind(this.onFileUploadError, this),
        success: _.bind(this.onFileUploadSuccess, this)
      });
      // Return false to prevent the page submitting
      return false;
    },

    onUploadSaveSuccess: function() {
      Origin.router.navigate('#/assetManagement', { trigger:true });
    },

    onUploadSaveError: function() {
      Origin.Notify.alert({
        type: 'error',
        text: window.polyglot.t('app.errorassetupdate')
      });
    },

    onFileSelected: function(event) {
      // Default 'title' -- remove C:\fakepath if it is added
      var title = this.$('.asset-file')[0].value.replace("C:\\fakepath\\", "");
      // change upload button label
      this.$('label[for=file] .btn-label').html(title);
      // set title field if empty
      var $title = this.$('.asset-title');
      if(_.isEmpty($title.val())) $title.val(title);
    },

    onFileUploadSuccess: function(data, status, xhr) {
      if(data._id) {
        this.model.set({ _id: data._id });
      }
      Origin.trigger('assets:update');
      Origin.router.navigate('#/assetManagement', { trigger:true });
    },

    onFileUploadError: function(xhr, status, error) {
      Origin.trigger('sidebar:resetButtons');
      var msg = xhr.responseJSON && xhr.responseJSON.message || xhr.responseText;
      Origin.Notify.alert({
        type: 'error',
        title: xhr.statusText,
        text: msg
      });
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
    },

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
    }
  }, {
    template: 'assetManagementNewAsset'
  });

  return AssetManagementNewAssetView;
});
