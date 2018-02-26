// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Backbone = require('backbone');
    var BackboneForms = require('backbone-forms');
    var Origin = require('core/origin');

    var ScaffoldQuestionButtonView = Backbone.Form.editors.Text.extend({

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
            'click .scaffold-question-button-clear': function(event) {
                event.preventDefault();
                this.$('input').val('');
                this.$('.scaffold-question-button-clear').addClass('display-none');
            }

        },

        initialize: function(options) {
            this.options = options;
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
            
        },

        render: function() {
            var courseButtonsData = Origin.editor.data.course.get('_buttons');
            var buttonField = '';
            if (courseButtonsData) {
                var fieldKey = this.options.key;
                var buttonField = (courseButtonsData[fieldKey] || '');
            }
            this.$el.append(Handlebars.templates[this.constructor.template]({field: buttonField}));
            this.setValue(this.value);

            this.checkClearButtonAvailability();
            
            return this;
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
                this.$('.scaffold-question-button-clear').addClass('display-none');
            } else {
                // Show
                this.$('.scaffold-question-button-clear').removeClass('display-none');
            }
        }
    }, {
        template: 'scaffoldQuestionButton'
    });

    Origin.on('origin:dataReady', function() {
        // Add Image editor to the list of editors
        Origin.scaffold.addCustomField('QuestionButton', ScaffoldQuestionButtonView)  
    })
    

    return ScaffoldQuestionButtonView;

})