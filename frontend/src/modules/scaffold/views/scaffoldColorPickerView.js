define([
  'core/origin',
  'backbone-forms',
  'colorPicker'
], function(Origin, BackboneForms, ColorPicker) {

  var ScaffoldColorPickerView = Backbone.Form.editors.Text.extend({

    tagName: 'div',

    className: 'scaffold-color-picker',

    render: function() {
      Backbone.Form.editors.Text.prototype.render.call(this);

      this.$el.ColorPicker({
        color: this.value,
        onBeforeShow: function() {
          this.$el.ColorPickerSetColor(this.value);
        }.bind(this),
        onChange: function(hsb, hex) {
          this.setValue('#' + hex);
        }.bind(this)
      });

      return this;
    },

    setValue: function(value) {
      Backbone.Form.editors.Text.prototype.setValue.call(this, value);

      this.$el.css('background-color', value);
    },

    remove: function() {
      $('#' + this.$el.data('colorpickerId')).remove();

      Backbone.Form.editors.Text.prototype.remove.call(this);
    }

  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('ColorPicker', ScaffoldColorPickerView);
  });

  return ScaffoldColorPickerView;

});
