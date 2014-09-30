define(function(require){

  var Backbone = require('backbone');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetManagementPreviewView = OriginView.extend({

    tagName: 'div',

    className: 'asset-management-preview',

    events: {
      'click .asset-preview-edit-button': 'onEditButtonClicked'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
      /*this.listenTo(this.model, 'destroy', this.remove);*/
    },

    postRender: function () {
      if (this.$('audio, video').length) {
        // Add wmv formats to the accepted types
        mejs.plugins.silverlight[0].types.push('video/x-ms-wmv');
        mejs.plugins.silverlight[0].types.push('audio/x-ms-wma');
        var mediaElement = this.$('audio, video').mediaelementplayer({
          pluginPath:'adaptbuilder/css/assets/',
          features: ['playpause','progress','current','duration']
        });
      }
    },

    onEditButtonClicked: function() {
      var assetId = this.model.get('_id');
      Backbone.history.navigate('#/assetManagement/' + assetId + '/edit', {trigger: true});
    }

  }, {
    template: 'assetManagementPreview'
  });

  return AssetManagementPreviewView;

});
