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
      var item = _.find(this.dragItems, function(i) {
        return i.$el[0] === event.currentTarget;
      });
      item.view.openEditor();
    },

    initialize: function(options) {
      ScaffoldAssetView.prototype.initialize.apply(this, arguments);
      this.init(options);
    },

    init: function(options) {
      var attrs = options.schema.inputType;
      this.dragItems = [];
      this.precision = attrs.precision || 3;
      this.topAttr = attrs.topAttribute || '_top';
      this.leftAttr = attrs.leftAttribute || '_left';
      this.items = attrs.items || '_items';
    },

    postRender: function() {
      if (!this.itemListView) {
        this.itemListView = this.findItemView();
        this.listenTo(this.itemListView, {
          add: this.onItemListAdd,
          remove: this.onItemListRemove,
          change: this.onItemListChange
        });
      }
      // double defer:
      // if external asset, postRender is triggered before el is injected into Dom
      _.defer(function() {
        var items = this.itemListView.items;
        this.removeDragItems();
        items && items.forEach(function(item) {
          this.addDragItem(item.editor);
        }, this);
      }.bind(this));
    },

    findItemView: function() {
      var form = Origin.scaffold.getCurrentForm();
      var inputType = this.schema.inputType;
      var targetAttr = inputType.targetAttribute;

      var baseEditor;

      switch (inputType.pluginType) {
        case 'extension':
          baseEditor = form.fields._extensions.editor.nestedForm.fields[targetAttr].editor;
          break;
        case 'menu':
          baseEditor = form.fields.menuSettings.editor.nestedForm.fields[targetAttr].editor;
          break;
        case 'theme':
          baseEditor = form.fields.themeSettings.editor.nestedForm.fields[targetAttr].editor;
          break;
        default:
          baseEditor = form.fields.properties.editor;
          break;
      }

      return baseEditor.nestedForm.fields[this.items].editor;
    },

    removeDragItems: function() {
      this.dragItems.forEach(this.removeDragItem, this);
      this.dragItems = [];
    },

    addDragItem: function(itemView) {
      var value = itemView.value;
      var index = itemView.$el.closest('.list-item').index();
      var elm = $('<div></div>', {
        css: {
          top: parseInt(value[this.topAttr]).toFixed(this.precision)+'%',
          left: parseInt(value[this.leftAttr]).toFixed(this.precision)+'%',
          position: 'absolute'
        },
        text: index + 1
      });

      this.dragItems.push({
        $el: elm,
        view: itemView
      });

      elm.appendTo('.scaffold-asset-item-img-holder').draggable({
        containment: 'parent',
        stop: this.onDragStop.bind(this)
      });
    },

    updateDragItem: function(item) {
      var index = item.view.$el.closest('.list-item').index();
      item.$el.css({
        top: parseInt(item.view.value[this.topAttr]).toFixed(this.precision)+'%',
        left: parseInt(item.view.value[this.leftAttr]).toFixed(this.precision)+'%',
      }).text(index + 1);
    },

    removeDragItem: function(item) {
      if (!item.$el.hasClass('ui-draggable')) return;
      item.$el.draggable('destroy').remove();
    },

    onItemListRemove: function(listView, listItemView) {
      var index = -1;
      for (var i = 0; i < this.dragItems.length; i++) {
        if (this.dragItems[i].view === listItemView) {
          index = i;
          break;
        }
      }
      this.removeDragItem(this.dragItems[index]);
      this.dragItems.splice(index, 1);
    },

    onItemListAdd: function(listView, listItemView) {
      this.addDragItem(listItemView);
    },

    onItemListChange: function(listView) {
      this.dragItems.forEach(this.updateDragItem, this);
    },

    onDragStop: function(event, ui) {
      var $dragHandle = $(event.target);
      var $parent = this.$('.scaffold-asset-item-img-holder');
      var left = (parseInt($dragHandle.css("left")) / ($parent.width() / 100)).toFixed(this.precision);
      var top = (parseInt($dragHandle.css("top")) / ($parent.height() / 100)).toFixed(this.precision);
      var index = $dragHandle.css({left: left + '%', top: top+'%'}).data('index');

      var child = _.find(this.dragItems, function(i) {
        return i.$el[0] === event.target;
      });

      if (!child) return;

      var value = {};
      value[this.leftAttr] = left;
      value[this.topAttr] = top;
      child.view.setValue(_.extend({}, child.view.value, value));
      child.view.renderSummary();
    },

    onAssetButtonClicked: function(event) {
      event.preventDefault();

      Origin.trigger('modal:open', AssetManagementModalView, {
        collection: new AssetCollection,
        assetType: 'Asset:image',
        _shouldShowScrollbar: false,
        onUpdate: function(data) {
          if (!data) return;

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
        url: id ? 'api/asset/serve/' + id : dataUrl,
        addLabel: this.schema.inputType.addLabel || Origin.l10n.t('app.add')
      }));

      _.defer(this.postRender.bind(this));
    },

    remove: function() {
      this.removeDragItems();
      this.dragItems = [];
      ScaffoldAssetView.prototype.remove.apply(this, arguments);
    }

  }, { template: 'scaffoldAssetItem' });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('AssetItem', ScaffoldAssetItemView);
  });

  return ScaffoldAssetItemView;

});
