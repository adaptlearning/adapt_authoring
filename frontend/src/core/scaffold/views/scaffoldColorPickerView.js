// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var _ = require('underscore');
    var Backbone = require('backbone');
    var BackboneForms = require('backboneForms');
    var Origin = require('coreJS/app/origin');
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

            _.defer(_.bind(function() {
                var self = this;
                // Setup colorPicker
                this.$el.ColorPicker({
                    color: self.value,
                    onSubmit: function (hsb, hex, rgb, el) {
                        self.setValue('#' + hex);
                        $(el).ColorPickerHide();
                    }
                });

                /*
                * HACK change the submit button
                */
                $('.colorpicker_submit', this.getColourPicker()).html(window.polyglot.t('app.coloursave'));


                /*
                * Append reset button
                */

                // TODO externalise this...
                var btnStyle = 'display:inline-block;margin-left:10px;position:relative;vertical-align:top;top:10px;cursor:pointer;';
                var btn = '<div class="reset" style="' + btnStyle + '"><i class="fa fa-ban"></i> ' + window.polyglot.t('app.colourclear') + '</div>';
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
            var colorpickerId = this.$el.data('colorpickerId');
            return $("#" + colorpickerId);
        }

    }, {
        template: "scaffoldColorPicker"
    });

    Origin.on('app:dataReady', function() {
        Origin.scaffold.addCustomField('ColorPicker', ScaffoldColorPickerView);
    })


    return ScaffoldColorPickerView;
});
