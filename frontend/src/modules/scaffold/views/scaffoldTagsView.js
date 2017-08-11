// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Backbone = require('backbone');
    var BackboneForms = require('backbone-forms');
    var Origin = require('core/origin');
    var Helpers = require('core/helpers');

    var ScaffoldTagsView = Backbone.Form.editors.Base.extend({

        tagName: 'textarea',

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

        initialize: function(options) {
            this.options = options;
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);

        },

        render: function() {
            this.setValue(this.value);
            _.delay(_.bind(function() {
                this.$el.tagsInput({
                    autocomplete_url: '/api/autocomplete/tag',
                    onAddTag: _.bind(this.onAddTag, this),
                    onRemoveTag: _.bind(this.onRemoveTag, this),
                    'minChars' : 3,
                    'maxChars' : 30
                });
            }, this), 500)

            return this;
        },

        getValue: function() {
            return this.model.get('tags');
        },

        setValue: function(value) {
            var values = Helpers.pickCSV(value, "title");
            this.$el.val(values);
        },

        focus: function() {
            if (this.hasFocus) return;

            // This method call should result in an input within this edior
            // becoming the `document.activeElement`.
            // This, in turn, should result in this editor's `focus` event
            // being triggered, setting `this.hasFocus` to `true`.
            // See above for more detail.
            this.$el.focus();
        },

        blur: function() {
            if (!this.hasFocus) return;

            this.$el.blur();
        },

        onAddTag: function (tag) {
            var model = this.model;
            $.ajax({
                url:'/api/content/tag',
                method:'POST',
                data: { title: tag }
            }).done(function (data) {
                if (data && data._id) {
                    var tags = model.get('tags');
                    tags.push({ _id: data._id, title: data.title });
                    model.set({ tags: tags });
                }
            });
        },

        onRemoveTag: function (tag) {
            var model = this.model;
            var tags = [];
            _.each(model.get('tags'), function (item) {
                if (item.title !== tag) {
                    tags.push(item);
                }
            });
            this.model.set({ tags: tags });
        }
    });

    Origin.on('origin:dataReady', function() {
        // Add Image editor to the list of editors
        Origin.scaffold.addCustomField('Tags', ScaffoldTagsView)
    })


    return ScaffoldTagsView;

})
