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
      'submit #assetForm' : 'onSave'
    },

    onSave: function(event) {
      event.preventDefault();

      $.ajax('/api/asset/', {
        method: 'POST'
        data: {title: 'Test', description: 'Test description', repository: 'localfs'}
        files: $(":file", this),
        iframe: true,
        processData: false
      }).complete(function(data) {
          console.log(data);
      });

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