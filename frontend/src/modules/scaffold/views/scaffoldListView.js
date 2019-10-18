define([
  'core/origin',
  'core/helpers',
  'core/models/courseAssetModel',
  'backbone-forms',
  'backbone-forms-lists'
], function(Origin, Helpers, CourseAssetModel, BackboneForms) {

  var ScaffoldListView = Backbone.Form.editors.List.extend({
    defaultValue: [],

    render: function() {
      var instance = Backbone.Form.editors.__List.prototype.render.apply(this, arguments);
      // set-up drag 'n drop
      this.$list.sortable({
        placeholder: 'sortable-placeholder',
        containment: '.app-inner',
        update: this.updateItemPositions.bind(this),
        start: function(event, ui) {
          Origin.scaffold.getCurrentModel().set('_isDragging', true);
          ui.placeholder.height(ui.item.height());
        },
        stop: function(event, ui) {
          _.defer(function() {
            Origin.scaffold.getCurrentModel().set('_isDragging', false);
          });
        }
      });
      return instance;
    },

    updateItemPositions: function(e, ui) {
      var $items = $('.list-item', this.$el);
      var newIndex = $items.index(ui.item);

      for(var i = 0, count = this.items.length; i < count; i++) {
        var item = this.items[i];

        if(!item.$el.is(ui.item)) continue;

        this.items.splice(i, 1);
        this.items.splice(newIndex, 0, item);

        this.trigger('change', this);
        return; // found our match, end here
      }
    },

    // HACK needed to fix reset functionality (see https://github.com/powmedia/backbone-forms/issues/517)
    setValue: function(value) {
      this.value = value;
      // remove previous items, and add new ones
      this.items.forEach(function(item) { item.remove(); });
      this.items = [];
      this.value.forEach(this.addItem.bind(this));
    },

    /**
    * Accomodate sweetalert in item removal
    */
    removeItem: function(item) {
      var remove = function(isConfirmed) {
        if(isConfirmed === false) return;

        var index = this.items.indexOf(item);
        this.items[index].remove();
        this.items.splice(index, 1);

        if(item.addEventTriggered) {
          this.trigger('remove', this, item.editor);
          this.trigger('change', this);
        }
        if(!this.items.length && !this.Editor.isAsync) {
          this.addItem();
        }
      }.bind(this);
      // no confirmation needed, just remove
      if(! this.schema.confirmDelete) return remove();
      // confirm delete action
      window.confirm({
        title: this.schema.confirmDelete,
        type: 'warning',
        callback: remove
      });
    }
  });

  var ScaffoldListItemView = Backbone.Form.editors.List.Item.extend({

    events: function() {
      return _.extend({}, Backbone.Form.editors.__List.__Item.prototype.events, {
        'click [data-action="clone"]': 'cloneItem'
      });
    },

    cloneItem: function(event) {
      var flatItem = Helpers.flattenNestedProperties(this.editor.value);
      var itemValues = _.values(flatItem);
      var parentAttributes = Origin.scaffold.getCurrentModel().attributes;
      itemValues.forEach(function(item) {
        if (typeof item !== 'string' || item.indexOf('course/assets') === -1) return;

        var itemFileName = item.substring(item.lastIndexOf('/')+1);
        $.ajax({
          url: 'api/asset/query',
          type:'GET',
          data: {search: { filename: itemFileName }},
          success: function (result) {
            (new CourseAssetModel()).save({
              _courseId : Origin.editor.data.course.get('_id'),
              _contentType : parentAttributes._type,
              _contentTypeId : parentAttributes._id,
              _fieldName : itemFileName,
              _assetId : result[0]._id,
              _contentTypeParentId: parentAttributes._parentId
            }, {
              error: function(error) {
                Origin.Notify.alert({
                  type: 'error',
                  text: Origin.l10n.t('app.errorsaveasset')
                });
              }
            });
          },
          error: function() {
            Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorduplication') });
          }
        });
      });

      this.list.addItem(this.editor.value, true);
    }
  });

  Origin.on('origin:dataReady', function() {
    // NOTE override default list view (keep the old one in case...)
    Backbone.Form.editors.__List = Backbone.Form.editors.List;
    Backbone.Form.editors.__List.__Item = Backbone.Form.editors.List.Item;

    Backbone.Form.editors.List = ScaffoldListView;
    Backbone.Form.editors.List.Item = ScaffoldListItemView;
    // overrides
    Backbone.Form.editors.List.prototype.constructor.template = Handlebars.templates.list;
    Backbone.Form.editors.List.Item.prototype.constructor.template = Handlebars.templates.listItem;
    Backbone.Form.editors.List.Modal.prototype.itemToString = modalItemToString;

    Backbone.Form.editors.List.Modal.prototype.__openEditor = Backbone.Form.editors.List.Modal.prototype.openEditor;
    Backbone.Form.editors.List.Modal.prototype.openEditor = openEditor;
  });

  /**
  * Helper functions
  */

  /**
  * Builds a string from nested values
  * OVERRIDES Backbone.Form.editors.List.Modal.prototype.itemToString
  */
  function modalItemToString(value) {
    if(!value) {
      return '';
    }
    return Object.keys(this.nestedSchema).reduce(function(parts, key) {
      var val = getModalItemValueString(value[key]);
      var title = this.nestedSchema[key].title || Backbone.Form.Field.prototype.createTitle.call({ key: key });
      return parts + '<p class="list-item-modal-item">' + wrapSchemaTitle(title) + val + '</p>';
    }.bind(this), '');
  }

  /**
  * FIX to avoid opening the modal after stopping dragging a list item
  * OVERRIDES Backbone.Form.editors.List.Modal.prototype.openEditor
  */
  function openEditor() {
    if(Origin.scaffold.getCurrentModel().get('_isDragging')) {
      return;
    }
    Backbone.Form.editors.List.Modal.prototype.__openEditor.apply(this, arguments);
  }

  /**
  * Returns an apt string value from Modal.Item value
  */
  function getModalItemValueString(value) {
    if (typeof value !== 'object') {
      return value;
    }
    if(Array.isArray(value)) {
      return Origin.l10n.t('app.items', { smart_count: Object.keys(value).length });
    }
    // print nested name/value pairs
    var pairs = '';
    for (var name in value) {
      if(value.hasOwnProperty(name)) pairs += '<br />' + wrapSchemaTitle(name) + value[name];
    }
    return '<p class="list-item-modal-object">' + pairs + '</p>';
  }

  function wrapSchemaTitle(value) {
    return '<span class="list-item-description">' + value + ':</span>';
  }

  return ScaffoldListView;
});
