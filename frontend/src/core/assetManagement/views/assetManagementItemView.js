// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('coreJS/app/views/originView');
  var Origin = require('coreJS/app/origin');

  var AssetItemView = OriginView.extend({
    tagName: 'div',
    className: function() {
      return 'asset-management-list-item id-' + this.model.get('_id');
    },

    events: {
      'click': 'onAssetClicked',
      'click button.asset-management-list-item-select': 'onAssetChosen',
      'click button.asset-management-list-item-autofill': 'onAssetChosen',
      'mouseover button': 'onButtonOver',
      'mouseout button': 'onButtonOut'
    },

    preRender: function() {
      var isImage = this.model.get('assetType') === "image";
      var currentModel = Origin.scaffold.getCurrentModel();
      var isEditingGraphic = currentModel && currentModel.get('_component') === 'graphic';
      this.model.set('canAutofill', isImage && isEditingGraphic);

      this.listenTo(Origin, 'assetManagement:modal:selectItem', this.selectItem);
      this.listenTo(Origin, 'assetManagement:assetViews:remove', this.remove);
      this.listenTo(this, 'remove', this.remove);
      this.listenTo(this.model, 'destroy', this.remove);
      this.listenTo(this.model, 'change:_isDeleted', this.onReRender);
    },

    onReRender: function() {
      this.render();
      _.defer(_.bind(function() {
        this.onInview();
      }, this));
    },

    postRender: function() {
      if (this.model.get('_isSelected')) {
        this.$el.addClass('selected');
        Origin.trigger('assetManagement:assetItemView:preview', this.model);
      }
      // Check if it needs to lazy load the asset image
      if (this.model.get('assetType') === 'image' || this.model.get('assetType') === 'video') {
          this.$el.on('inview', _.bind(this.onInview, this));
      }
    },

    selectItem: function(modelId) {
      if (modelId === this.model.get('_id')) {
        this.onAssetClicked();
      }
    },

    onAssetClicked: function(e) {
      $('.asset-management-list-item').removeClass('selected');
      this.$el.addClass('selected');
      this.model.set('_isSelected', true);
      Origin.trigger('assetManagement:assetItemView:preview', this.model);
    },

    onAssetChosen: function(e) {
      Origin.trigger('assetManagement:modal:update', {
        model: this.model,
        _shouldAutofill: e && $(e.currentTarget).hasClass('asset-management-list-item-autofill')
      });
    },

    onButtonOver: function(e) {
      $(e.currentTarget).siblings('.tooltip').addClass('show');
    },

    onButtonOut: function(e) {
      $(e.currentTarget).siblings('.tooltip').removeClass('show');
    },

    onInview: function() {
      // Once this asset is inview - change the data-style attribute to the
      // actual style attribute
      var $previewImage = this.$('.asset-management-list-item-content');
      $previewImage.attr('style', $previewImage.attr('data-style'));
      // Remove inview as it's not needed anymore
      this.$el.off('inview');
    }
  }, {
    template: 'assetManagementListItem'
  });

  return AssetItemView;
});
