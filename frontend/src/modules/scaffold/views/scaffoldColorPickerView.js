// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var BackboneForms = require('backbone-forms');
  var Origin = require('core/origin');
  var ColorPicker = require('colorPicker');

  var ScaffoldColorPickerView = Backbone.Form.editors.Text.extend({
    tagName: 'div',
    className: 'scaffold-color-picker',

    events: {
      'change': function() {
        // The 'change' event should be triggered whenever something happens
        // that affects the result of `this.getValue()`.
        this.trigger('change', this);
      },
      'focus': function() {
        // The 'focus' event should be triggered whenever an input within
        // this editor becomes the `document.activeElement`.
        this.trigger('focus', this);
        // This call automatically sets `this.hasFocus` to `true`.
      },
      'blur': function() {
        // The 'blur' event should be triggered whenever an input within
        // this editor stops being the `document.activeElement`.
        this.trigger('blur', this);
        // This call automatically sets `this.hasFocus` to `false`.
      }
    },

    render: function() {
      if (this.value === null) {
        this.value = '';
      }
      this.setValue(this.value);
      this.$el.css('backgroundColor', this.getValue());

      _.defer(_.bind(function() {
        // Setup colorPicker
        this.$el.ColorPicker({
          color: this.value,
          onSubmit: _.bind(function(hsb, hex, rgb, el) {
            this.setValue('#' + hex);
            $(el).ColorPickerHide();
          }, this)
        });
        /**
        * HACK change the submit button
        */
        $('.colorpicker_submit', this.getColourPicker()).html(Origin.l10n.t('app.coloursave'));
        /*
        * Append reset button
        */
        // FIXME externalise this...
        var btnStyle = 'display:inline-block;margin-left:10px;position:relative;vertical-align:top;top:10px;cursor:pointer;';
        var btn = '<div class="reset" style="' + btnStyle + '"><i class="fa fa-ban"></i> ' + Origin.l10n.t('app.colourclear') + '</div>';
        this.$el.after(btn);
        this.$el.siblings('.reset').click(_.bind(this.resetValue, this));

        if(this.value) {
          this.setValue(this.value);
          this.$el.siblings('.reset').show();
        }
        else {
          this.$el.siblings('.reset').hide();
        }

      }, this));

      return this;
    },

    remove: function() {
      this.removeColorPicker();
      Backbone.Form.editors.Text.prototype.remove.apply(this, arguments);
    },

    removeColorPicker: function() {
      this.getColourPicker().remove();
    },

    setValue: function(newValue) {
      Backbone.Form.editors.Text.prototype.setValue.apply(this, arguments);
      this.value = newValue;
      this.$el.css('backgroundColor', this.value);
      this.$el.ColorPickerSetColor(this.value);

      if(this.value) this.$el.siblings('.reset').show();
      else this.$el.siblings('.reset').hide();
    },

    resetValue: function() {
      this.setValue('');
    },

    getColourPicker: function() {
      return $("#" + this.$el.data('colorpickerId'));
    }

  }, {
    template: "scaffoldColorPicker"
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('ColorPicker', ScaffoldColorPickerView);
  });

  return ScaffoldColorPickerView;
});
