// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('core/helpers');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var TagsInput = require('jqueryTagsInput');

  var FrameworkImportView = OriginView.extend({
    tagName: 'div',
    className: 'frameworkImport',
    createdCourseId: false,

    preRender: function() {
      Origin.trigger('location:title:update', { title: Origin.l10n.t('app.frameworkimporttitle') });
      this.listenTo(Origin, 'frameworkImport:uploadCourse', this.uploadCourse);
    },

    postRender: function() {
      // tagging
      this.$('#tags_control').tagsInput({
        autocomplete_url: '/api/autocomplete/tag',
        onAddTag: _.bind(this.onAddTag, this),
        onRemoveTag: _.bind(this.onRemoveTag, this),
        'minChars' : 3,
        'maxChars' : 30
      });
      this.setViewToReady();
    },

    isValid: function() {
      var uploadFile = this.$('.asset-file');
      var validated = true;
      var uploadFileErrormsg = $('.field-file').find('span.error');

      if (this.model.isNew() && !uploadFile.val()) {
        validated = false;
        $(uploadFile).addClass('input-error');
        $(uploadFileErrormsg).text(Origin.l10n.t('app.pleaseaddfile'));
      } else {
        $(uploadFile).removeClass('input-error');
        $(uploadFileErrormsg).text('');
      }
      return validated;
    },

    uploadCourse: function(sidebarView) {
      if(!this.isValid()) return;

      sidebarView.updateButton('.framework-import-sidebar-save-button', Origin.l10n.t('app.importing'));

      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        item._id && tags.push(item._id);
      });
      this.$('#tags').val(tags);

      // submit form data
      this.$('form.frameworkImport').ajaxSubmit({

        uploadProgress: function(event, position, total, percentComplete) {
          $(".progress-container").css("visibility", "visible");
          var percentVal = percentComplete + '%';
          $(".progress-bar").css("width", percentVal);
          $('.progress-percent').html(percentVal);
        },

        error: _.bind(this.onAjaxError, this),
        success: _.bind(this.onFormSubmitSuccess, this)
      });

      return false;
    },

    goBack: function() {
      Origin.router.navigateToHome();
    },

    onFormSubmitSuccess: function(data, importStatus, importXhr) {
      Origin.router.navigateToHome();
    },

    onAjaxError: function(data, status, error) {
      var resJson = data.responseJSON || {};
      var title = resJson.title || Origin.l10n.t('app.importerrortitle');
      var msg = resJson.body && resJson.body.replace(/\n/g, "<br />") || error;
      this.promptUser(title, msg, true);
    },

    promptUser: function(title, message, isError) {
      Origin.trigger('sidebar:resetButtons');
      Origin.Notify.alert({
        type: (!isError) ? 'success' : 'error',
        title: title,
        text: message
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
      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        if (item.title !== tag) {
          tags.push(item);
        }
      });
      this.model.set({ tags: tags });
    }
  }, {
    template: 'frameworkImport'
  });

  return FrameworkImportView;
});
