// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Backbone = require('backbone');
    var BackboneForms = require('backbone-forms');
    var Origin = require('core/origin');

    var ScaffoldDisplayTitleView = Backbone.Form.editors.Text.extend({

        tagName: 'div',

        events: {
            'change input': function() {
                // The 'change' event should be triggered whenever something happens
                // that affects the result of `this.getValue()`.
                this.checkClearButtonAvailability();
                this.trigger('change', this);
            },
            'focus input': function() {
                // The 'focus' event should be triggered whenever an input within
                // this editor becomes the `document.activeElement`.
                this.trigger('focus', this);
                // This call automatically sets `this.hasFocus` to `true`.
            },
            'blur input': function() {
                // The 'blur' event should be triggered whenever an input within
                // this editor stops being the `document.activeElement`.
                this.trigger('blur', this);
                // This call automatically sets `this.hasFocus` to `false`.
            },
            'keyup input': function() {
                this.checkClearButtonAvailability();
                this.trigger('change', this);
            },
            'click .scaffold-display-title-clear': function(event) {
                event.preventDefault();
                this.$('input').val('');
                this.setToUnlocked();
            },
            'click .scaffold-display-title-lock': function(event) {
                event.preventDefault();
                if (this.isLocked) {
                    this.setToUnlocked();
                } else {
                    this.setToLocked();
                }
            }

        },

        initialize: function(options) {
            this.options = options;
            // Listen to title input
            
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
                       
        },

        render: function() {
            this.$el.append(Handlebars.templates[this.constructor.template]({field: ''}));
            this.setValue(this.value);

            this.checkClearButtonAvailability();
            

            _.defer(_.bind(this.postRender, this));
            
            return this;
        },

        postRender: function() {
            this.titleField = this.options.form.fields.title.$('input');
            // Listen to title input
            var that = this;
            this.titleField.on('keyup', function() {
                if (that.isLocked) {
                    that.setValue($(this).val());
                }
            });
            this.checkLockButtonState();
        },

        getValue: function() {
            return this.$('input').val();
        },

        setValue: function(value) {
            this.$('input').val(value);
        },

        focus: function() {
            if (this.hasFocus) return;

            // This method call should result in an input within this edior
            // becoming the `document.activeElement`.
            // This, in turn, should result in this editor's `focus` event
            // being triggered, setting `this.hasFocus` to `true`.
            // See above for more detail.
            this.$('input').focus();
        },

        blur: function() {
            if (!this.hasFocus) return;

            this.$('input').blur();
        },

        checkClearButtonAvailability: function() {
            if (!this.$('input').val()) {
                // Hide
                this.$('.scaffold-display-title-clear').addClass('display-none');
            } else {
                // Show
                this.$('.scaffold-display-title-clear').removeClass('display-none');
            }
        },

        checkLockButtonState: function() {
            if (this.titleField.val() === this.getValue() && this.getValue().length > 0) {
                this.setToLocked();
            } else {
                this.setToUnlocked();
            }
        },

        setToLocked: function() {
            this.isLocked = true;
            this.$('.scaffold-display-title-lock i').removeClass('fa-unlink');
            this.$('input').attr('disabled', true).val(this.titleField.val());
        },

        setToUnlocked: function() {
            this.isLocked = false;
            this.$('.scaffold-display-title-lock i').addClass('fa-unlink');
            this.$('input').attr('disabled', false);
        },

        remove: function() {
            this.titleField.off('keyup');

            this.editor && this.editor.remove();

            Backbone.View.prototype.remove.call(this);
        }

    }, {
        template: 'scaffoldDisplayTitle'
    });

    Origin.on('origin:dataReady', function() {
        // Add Image editor to the list of editors
        Origin.scaffold.addCustomField('DisplayTitle', ScaffoldDisplayTitleView)  
    })
    

    return ScaffoldDisplayTitleView;

})