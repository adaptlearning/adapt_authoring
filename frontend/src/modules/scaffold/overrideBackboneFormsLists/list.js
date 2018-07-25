define([
  'backbone-forms',
  'backbone-forms-lists',
], function(BackboneForms, BackboneFormsLists) {
  'use strict';

  var List = Backbone.Form.editors.List.prototype;
  var listSetValue = List.setValue;

  return {

    setValue: function(value) {
      this.items = [];
      listSetValue.call(this, value);
    },

    render: function() {
      var self = this,
          value = this.value || [],
          $ = Backbone.$;
  
      //Create main element
      var $el = $($.trim(this.template({
        addLabel: this.schema.addLabel
      })));
  
      //Store a reference to the list (item container)
      this.$list = $el.is('[data-items]') ? $el : $el.find('[data-items]');
  
      //Add existing items
      if (value.length) {
        _.each(value, function(itemValue) {
          self.addItem(itemValue);
        });
      }
  
      //If no existing items create an empty one, unless the editor specifies otherwise
      else {
        if (!this.Editor.isAsync) this.addItem();
      }
  
      // cache existing element
      var domReferencedElement = this.el;
  
      this.setElement($el);
  
      // replace existing element
      if (domReferencedElement) {
        $(domReferencedElement).replaceWith(this.el);
      }
  
      this.$el.attr('id', this.id);
      this.$el.attr('name', this.key);
  
      if (this.hasFocus) this.trigger('blur', this);
  
      return this;
    },

    removeItem: function(item) {
      //Confirm delete
      var confirmMsg = this.schema.confirmDelete;
  
      var remove = function(isConfirmed) {
        if (isConfirmed === false) return;
  
        var index = _.indexOf(this.items, item);
  
        this.items[index].remove();
        this.items.splice(index, 1);
  
        if (item.addEventTriggered) {
          this.trigger('remove', this, item.editor);
          this.trigger('change', this);
        }
  
        if (!this.items.length && !this.Editor.isAsync) this.addItem();
      }.bind(this);
  
      if (confirmMsg) {
        window.confirm({ title: confirmMsg, type: 'warning', callback: remove });
      } else {
        remove();
      }
    }
  }

});
