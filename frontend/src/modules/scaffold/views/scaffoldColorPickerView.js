// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

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
            // Listen to remove:views and remove color picker
            this.listenTo(Origin, 'remove:views', this.removeColorPicker);

            if (this.value === null) {
                this.value = '';
            }
            
            this.setValue(this.value);
            this.$el.css('backgroundColor', this.getValue());

            _.defer(_.bind(function() {
                var that = this;
                // Setup colorPicker
                this.$el.ColorPicker({
                    color: that.value,
                    onChange: function (hsb, hex, rgb) {
                        that.setValue('#' + hex);
                        that.$el.css('backgroundColor', '#' + hex);
                    },
                    onBeforeShow: function () {
                        that.$el.ColorPickerSetColor(that.value);
                    }
                });


            }, this));

            return this;
        },

        removeColorPicker: function() {
            var colorpickerId = this.$el.data('colorpickerId');
            $("#"+colorpickerId).remove();
        }

    }, {
        template: "scaffoldColorPicker"
    });

    Origin.on('origin:dataReady', function() {
        Origin.scaffold.addCustomField('ColorPicker', ScaffoldColorPickerView);
    })
    

    return ScaffoldColorPickerView;

})