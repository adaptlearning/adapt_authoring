define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetView = OriginView.extend({

    // settings: {
    //   autoRender: false
    // },

    tagName: 'div',

    className: 'asset',

    events: {
      'submit #assetForm'   : 'onSubmit',
      'click #cancelButton' : 'onCancel'
    },

    postRender: function() {

    },

    onCancel: function(event) {
      event.preventDefault();

      this.goToList();
    },

    onSubmit: function(event) {
      event.preventDefault();

      this.uploadFile();

      this.goToList();
      // Return false to prevent the page submitting
      return false;
    },

    uploadFile: function() {  
      $('#assetForm').ajaxSubmit({                                                                                                             
        error: function(xhr, status, error) {
          console.log('Error: ' + xhr.status);
        },
    
        success: function(data, status, xhr) {
          console.log('success!');
        }
      });

      // Return false to prevent the page submitting
      return false;
    },

    goToList: function() {
      Backbone.history.navigate('/asset', {trigger: true});
    }
    // preRender: function() {
    //   this.listenTo(this, 'remove', this.remove);
    //   this.listenTo(this.model, 'destroy', this.remove);
    // }
    
  }, {
    template: 'asset'
  });

  return AssetView;

});