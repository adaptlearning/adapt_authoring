// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Helpers = require('coreJS/app/helpers');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var TagsInput = require('core/libraries/jquery.tagsinput.min');

  var CourseImportView = OriginView.extend({
    tagName: 'div',
    className: 'courseImport',
    createdCourseId: false,

    preRender: function() {
      Origin.trigger('location:title:update', { title: window.polyglot.t('app.courseimporttitle') });
      this.listenTo(Origin, 'courseImport:uploadCourse', this.uploadCourse);
    },

    postRender: function() {
      this.setViewToReady();
    },

    isValid: function() {
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

    uploadCourse: function() {
      if(!this.isValid()) {
        return;
      }

      // submit form data
      this.$('form.courseImport').ajaxSubmit({

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
      Origin.router.navigate('#/dashboard', { trigger:true });
    },

    onFormSubmitSuccess: function(importData, impoprtStatus, importXhr) {
      this.createdCourseId = importData._id;

      var self = this;
      Origin.router.navigate('#/dashboard', { trigger:true });
    },

    onAjaxSuccess: function() {
      this.goBack();
    },

    onAjaxError: function(data, status, error) {
      Origin.trigger('sidebar:resetButtons');
      // We may have a partially created course, make sure it's gone
      if(this.createdCourseId) {
        // TODO - add route for course destroy
        //$.ajax('/api/course/' + this.createdCourseId, { method: 'DELETE', error: _.bind(this.onAjaxError, this) });
      }
      Origin.Notify.alert({
        type: 'error',
        title: window.polyglot.t('app.importerrortitle'),
        text: data.responseText || error
      });
    }
  }, {
    template: 'courseImport'
  });

  return CourseImportView;
});
