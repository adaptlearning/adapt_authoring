define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetView = OriginView.extend({

    tagName: 'div',

    className: 'asset units-row',

    events: {
      'submit .asset-form'          : 'onSubmit',
      'change .asset-file'          : 'onChangeFile',
      'click .toggle-asset-form'    : 'toggleAssetForm',
      'click .cancel-button'        : 'toggleAssetForm',
      'click .asset-nav-tabs ul li' : 'switchTab'
    },

    preRender: function() {
      this.listenTo(Origin, 'asset:clearForm', this.clearForm);
    },

    postRender: function() {
      this.$('.assets-container').css({height: $('#app').height()});
    },

    onChangeFile: function(event) {
      var $title = this.$('.asset-title');

      // Default 'title' -- remove C:\fakepath if it is added
      $title.val(this.$('.asset-file')[0].value.replace("C:\\fakepath\\", ""));
    },

    onSubmit: function(event) {
      event.preventDefault();

      this.uploadFile();

      // Return false to prevent the page submitting
      return false;
    },

    clearForm: function() {
      this.$('.asset-form').trigger("reset");
    },

    uploadFile: function() {
      var view = this;

      this.$('.asset-form').ajaxSubmit({
        error: function(xhr, status, error) {
          console.log('Error: ' + xhr.status);
        },
    
        success: function(data, status, xhr) {
          Origin.trigger('asset:clearForm');
          Origin.trigger('assets:update');
          view.toggleAssetForm();
        }
      });

      // Return false to prevent the page submitting
      return false;
    },

    toggleAssetForm: function(event) {
      if (event) {
        event.preventDefault();
      }
      this.$('.toggle-asset-form').toggleClass('display-none');
      this.$('.asset-form').slideToggle();
    },

    switchTab: function(e) {
      e.preventDefault();
      this.$('.asset-nav-tabs ul li a').removeClass('active');
      this.$(e.currentTarget).find('a').addClass('active');
      this.showTab(this.$(e.currentTarget).index());
    },

    showTab: function (tab) {
      this.$('.asset-tab-content').removeClass('active');
      this.$('.asset-tab-content').eq(tab).addClass('active');
    }
    
  }, {
    template: 'asset'
  });

  return AssetView;

});