// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var CourseImportView = OriginView.extend({
    tagName: 'div',
    className: 'courseImport',

    events: {
      'change input[name=file]': 'onFileSelected',
      'dragenter label[for=file]': 'onDrag',
      'dragover label[for=file]': 'onDrag',
      'dragleave label[for=file]': 'onDrop',
      'dragend label[for=file]': 'onDrop',
      'drop label[for=file]': 'onDrop'
    },

    preRender: function() {
      //events
      Origin.on('courseImport:import', this.submit, this);

      Origin.trigger('location:title:update', {title: window.polyglot.t('app.importsidebartitle')});
    },

    postRender: function() {
      this.setViewToReady();
    },

    submit: function() {
      // HACK in case the browser file filter doesn't work
      // (FF, I'm looking at you - https://bugzilla.mozilla.org/show_bug.cgi?id=826176)
      var isZip = this.$('form input[type="file"]').val().search(/.(?:\.zip$)/) > -1;
      if(!isZip) {
        return this.showError();
      } else {
        this.hideError();
      }

      // TODO localise notify strings
      this.$('form').ajaxSubmit({
        error: function(data, status, error) {
          Origin.Notify.alert({
            type: 'error',
            title: 'Import error',
            text: data.responseJSON && data.responseJSON.message || data.statusText
          });
          Origin.router.navigate('#/dashboard', { trigger: true });
        },
        success: function(data, status, xhr) {
          Origin.Notify.alert({
            type: 'success',
            title: 'Import successful',
            text: data.message
          });
          Origin.router.navigate('#/dashboard', { trigger: true });
        }
      });

      return false;
    },

    showError: function(errorText) {
      this.$('label[for=file]').addClass('validation-error');
    },

    hideError: function(errorText) {
      this.$('label[for=file]').removeClass('validation-error');
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
      var title = this.$('input[name=file]')[0].value.replace("C:\\fakepath\\", "");
      // change upload button label
      this.$('label[for=file] .btn-label').html(title);
      this.$('label[for=file]').removeClass('validation-error').addClass('selected');
    },
  }, {
    template: 'courseImport'
  });

  return CourseImportView;
});
