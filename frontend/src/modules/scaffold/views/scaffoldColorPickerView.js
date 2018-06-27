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
      /*
      if (this.value === null) {
        this.value = '';
      }
      this.setValue(this.value);
      this.$el.css('backgroundColor', this.getValue());
      */

      this.$el.ColorPicker({
        color: this.value,
        onBeforeShow: function() {
          this.$el.ColorPickerSetColor(this.value);
        }.bind(this),
        onSubmit: function(hsb, hex, rgb, el) {
          this.setValue('#' + hex);
          $(el).ColorPickerHide();
        }.bind(this)
      });
      /*
      // HACK change the submit button
      $('.colorpicker_submit', this.getColourPicker()).html(Origin.l10n.t('app.coloursave'));
      // Append reset button
      // FIXME externalise this...
      var btnStyle = 'display:inline-block;margin-left:10px;position:relative;vertical-align:top;top:10px;cursor:pointer;';
      var btn = '<div class="reset" style="' + btnStyle + '"><i class="fa fa-ban"></i> ' + Origin.l10n.t('app.colourclear') + '</div>';
      this.$el.after(btn);
      this.$el.siblings('.reset').click(_.bind(this.resetValue, this));

      if(this.value) this.setValue(this.value);
      this.$el.siblings('.reset').show(this.value);
      */
      return this;
    },

    setValue: function(value) {
      Backbone.Form.editors.Text.prototype.setValue.call(this, value);
      this.$el.css('background-color', value);
      /*
      this.value = newValue;
      this.$el.ColorPickerSetColor(this.value);

      if(this.value) this.$el.siblings('.reset').show();
      else this.$el.siblings('.reset').hide();
      */
    },

    resetValue: function() {
      this.setValue('');
    },

    remove: function() {
      this.getColourPicker().remove();
      Backbone.Form.editors.Text.prototype.remove.call(this);
    },

    getColourPicker: function() {
      return $("#" + this.$el.data('colorpickerId'));
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('ColorPicker', ScaffoldColorPickerView);
  });

  return ScaffoldColorPickerView;
});
