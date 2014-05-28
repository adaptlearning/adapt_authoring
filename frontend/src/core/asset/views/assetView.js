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
      'submit #assetForm' : 'uploadFile'
    },

    postRender: function() {

    },


    uploadFile: function(event) {
      event.preventDefault();
      console.log('uploading the file ...');
   
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

    // preRender: function() {
    //   this.listenTo(this, 'remove', this.remove);
    //   this.listenTo(this.model, 'destroy', this.remove);
    // }
    
  }, {
    template: 'asset'
  });

  return AssetView;

});