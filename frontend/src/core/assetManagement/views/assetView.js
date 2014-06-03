define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetView = OriginView.extend({

    tagName: 'div',

    className: 'asset units-row',

    events: {
      'submit #assetForm'        : 'onSubmit',
      'click #cancelButton'      : 'onCancel',
      'change #file'             : 'onChangeFile',
      'click .toggle-asset-form' : 'toggleAssetForm',
      'click .add-asset-cancel'  : 'toggleAssetForm',
      'click .nav-tabs ul li'    : 'switchTab'
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
    },

    toggleAssetForm: function() {
      this.$('.toggle-asset-form').toggleClass('display-none');
      this.$('.asset-form').slideToggle();
    },

    switchTab: function(e) {
      e.preventDefault();
      this.$('.nav-tabs ul li a').removeClass('active');
      this.$(e.currentTarget).find('a').addClass('active');
      this.showTab(this.$(e.currentTarget).index());
    },

    showTab: function (tab) {
      this.$('.tab-content').removeClass('active');
      this.$('.tab-content').eq(tab).addClass('active');
    }
    
  }, {
    template: 'asset'
  });

  return AssetView;

});