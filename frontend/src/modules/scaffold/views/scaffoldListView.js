define([
  'core/origin',
  'backbone-forms',
  'backbone-forms-lists'
], function(Origin, BackboneForms) {

  var ScaffoldListView = Backbone.Form.editors.List.extend({
    render: function() {
      var instance = Backbone.Form.editors.__List.prototype.render.apply(this, arguments);
      // set-up drag 'n drop
      this.$list.sortable({
        placeholder: 'sortable-placeholder',
        axis: 'y',
        update: this.updateItemPositions.bind(this),
        start: function(event, ui) {
          ui.placeholder.height(ui.item.height());
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

  Origin.on('origin:dataReady', function() {
    // NOTE override default list view (keep the old one in case...)
    Backbone.Form.editors.__List = Backbone.Form.editors.List;
    Backbone.Form.editors.List = ScaffoldListView;
    // overrides
    Backbone.Form.editors.List.prototype.constructor.template = Handlebars.templates.list;
    Backbone.Form.editors.List.Item.prototype.constructor.template = Handlebars.templates.listItem;
    Backbone.Form.editors.List.Modal.prototype.itemToString = modalItemToString;
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
      var schema = this.nestedSchema[key];
      var val = getModalItemValueString(value[key]);
      var desc = schema.title ? schema.title : Backbone.Form.Field.prototype.createTitle.call({ key: key });
      return parts + '<span class="list-item-description">' + desc + ':</span>' + val + '<br />';
    }.bind(this), '');
  }

  /**
  * Returns an apt string value from Modal.Item value
  */
  function getModalItemValueString(value) {
    if(!value) {
      return '';
    }
    if(Array.isArray(value)) {
      return Origin.l10n.t('app.items', value.length);
    }
    if(typeof val === 'object') { // print nested name/value pairs
      var pairs = '' + Origin.l10n.t('app.items', { smart_count: Object.keys(value).length });
      for (var name in value) {
        if(val.hasOwnProperty(name)) pairs += '<br />' + name + ' - ' + value[name];
      }
      return pairs;
    }
    return value;
  }

  return ScaffoldListView;
});
