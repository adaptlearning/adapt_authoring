define([
  'core/origin',
  'backbone-forms',
  'core/helpers',
  './scaffoldAssetView',
  'core/models/courseAssetModel',
  'modules/assetManagement/views/assetManagementModalView',
  'modules/assetManagement/collections/assetCollection'
], function(Origin, BackboneForms, Helpers, ScaffoldAssetView, CourseAssetModel, AssetManagementModalView, AssetCollection) {

  var ScaffoldAssetItemView = ScaffoldAssetView.extend({

    events: function() {
      return _.extend({}, ScaffoldAssetView.prototype.events, {
        'click .add-item': 'onAddItemClick',
        'click .ui-draggable': 'onDragItemClick'
      });
    },

  	onAddItemClick: function(event) {
      event.preventDefault();
      this.itemListView.addItem();
    },

    onDragItemClick: function(event) {
      var index = $(event.target).data('index');
      this.itemListView.items[index].editor.openEditor()
    },

    initialize: function(options) {
      ScaffoldAssetView.prototype.initialize.apply(this, arguments);
      this.init(options);
    },

    init: function(options) {
      this.precision = options.schema.editorAttrs['data-precision'] || 3;
      this.topAttr = options.schema.editorAttrs['data-topAttribute'] || '_top';
      this.leftAttr = options.schema.editorAttrs['data-leftAttribute'] || '_left';
      this.itemsPath = options.schema.editorAttrs['data-items'] || 'properties._items';
      this.itemsPath = this.itemsPath.split('.');
    },

    postRender: function() {
      if (!this.itemListView) {
        this.itemListView = this.findItemView();
        this.listenTo(this.itemListView, {
          'remove': this.onItemListRemove,
          'item:change': this.onItemListChange
        });
      }
      this.renderDragItems();
    },

    findItemView: function() {
      var form = Origin.scaffold.getCurrentForm();
      if (this.schema.editorAttrs['data-isExtension']) {
        return form.fields._extensions.editor.nestedForm.fields[this.schema.editorAttrs['data-pluginName']].editor.nestedForm.fields[this.schema.editorAttrs['data-items']].editor;
      }
      return form.fields.properties.editor.nestedForm.fields[this.schema.editorAttrs['data-items']].editor;
    },

    renderDragItems: function() {
      if (!this.value) return;

      this.removeDragItems();
      this.itemListView.value && this.itemListView.value.forEach(function(i, index) {
        $('<div></div>', {
          css: {
            top: parseInt(i[this.topAttr]).toFixed(this.precision)+'%',
            left: parseInt(i[this.leftAttr]).toFixed(this.precision)+'%'
          },
          text: index + 1,
          'data-index': index
        }).appendTo('.scaffold-asset-item-img-holder').draggable({
          containment: 'parent',
          stop: this.onDragStop.bind(this)
        }).css( 'position', 'absolute' );
      }, this);
    },

    removeDragItems: function() {
      this.$('.scaffold-asset-item-img-holder .ui-draggable').draggable('destroy').remove();
    },

    onItemListRemove: function(listView, listItemView) {
      var newValue = listView.getValue();
      this.itemListView.setValue(newValue);
      this.renderDragItems();
    },

    onItemListChange: function(listView, listItemView) {
      var index = listItemView.$el.parents('.list-item').index();
      var newValue = this.itemListView.value;
      newValue[index] = listItemView.value;
      this.itemListView.setValue(newValue);
      this.renderDragItems();
    },

    onDragStop: function(event, ui) {
      var $parent = this.$('.scaffold-asset-item-img-holder');
      var left = (parseInt($(event.target).css("left")) / ($parent.width() / 100)).toFixed(this.precision);
      var top = (parseInt($(event.target).css("top")) / ($parent.height() / 100)).toFixed(this.precision);
      $(event.target).css({left: left + '%', top: top+'%'}).data('index');

      var child = this.itemListView.items[index];
      var value = {};
      value[this.leftAttr] = left;
      value[this.topAttr] = top;
      child.editor.setValue(_.extend({}, child.value, value));
      child.editor.renderSummary();
    },

    onAssetButtonClicked: function(event) {
      event.preventDefault();

      Origin.trigger('modal:open', AssetManagementModalView, {
        collection: new AssetCollection,
        assetType: 'Asset:image',
        _shouldShowScrollbar: false,
        onUpdate: function(data) {
          if (!data) return;

          if (this.key === 'heroImage') {
            this.setValue(data.assetId);
            this.saveModel({ heroImage: data.assetId });
            return;
          }

          var model = Origin.scaffold.getCurrentModel();

          var courseAssetObject = {
            contentTypeId: model.get('_id') || '',
            contentType: model.get('_type') || model._type,
            contentTypeParentId: model.get('_parentId') || Origin.editor.data.course.get('_id'),
            fieldname: data.assetFilename,
            assetId: data.assetId
          };

          this.setValue(data.assetLink);
          this.createCourseAsset(courseAssetObject);
        }
      }, this);
    },

    renderData: function(id) {
      var dataUrl = Helpers.isAssetExternal(this.value) ? this.value : '';

      this.$el.html(Handlebars.templates[this.constructor.template]({
        value: this.value,
        type: 'image',
        url: id ? '/api/asset/serve/' + id : dataUrl,
        addLabel: this.schema.editorAttrs['data-addLabel'] || Origin.l10n.t('app.add')
      }));

      _.defer(this.postRender.bind(this));
    },

    remove: function() {
      this.removeDragItems();
      ScaffoldAssetView.prototype.remove.apply(this, arguments);
    }

  }, { template: 'scaffoldAssetItem' });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('AssetItem', ScaffoldAssetItemView);
  });

  return ScaffoldAssetItemView;

});
