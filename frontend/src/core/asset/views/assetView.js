define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetView = OriginView.extend({

    tagName: 'div',

    className: 'asset',

    events: {
      'submit #assetForm'   : 'onSubmit',
      'click #cancelButton' : 'onCancel',
      'change #file'        : 'onChangeFile'
    },

    preRender: function() {
      this.listenTo(Origin, 'asset:clearForm', this.clearForm);
    },

    onChangeFile: function(event) {
      var $title = $('#title');

      // Default 'title'
      $title.val($('#file')[0].value);
    },

    onCancel: function(event) {
      event.preventDefault();

      this.goToList();
    },

    onSubmit: function(event) {
      event.preventDefault();

      this.uploadFile();

      // Return false to prevent the page submitting
      return false;
    },

    clearForm: function() {
      $('#assetForm').trigger("reset");
    },

    uploadFile: function() {
      var view = this;

      $('#assetForm').ajaxSubmit({                                                                                                             
        error: function(xhr, status, error) {
          console.log('Error: ' + xhr.status);
        },
    
        success: function(data, status, xhr) {
          Origin.trigger('asset:clearForm');
          Origin.trigger('assets:update');
        }
      });

      // Return false to prevent the page submitting
      return false;
    },

    goToList: function() {
      Backbone.history.navigate('/asset', {trigger: true});
    }
    
  }, {
    template: 'asset'
  });

  return AssetView;

});