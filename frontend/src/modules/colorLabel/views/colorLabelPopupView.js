define([
    'core/origin',
    'core/views/originView'
], function(Origin, OriginView) {

    var ColorLabelPopUpView = OriginView.extend({

        className: 'colorlabel',

        events: {
            'click .reset': 'onReset',
            'click .apply': 'onApply',
            'click .cancel': 'remove',
            'click .color-item': 'onItemClick'
        },

        initialize: function(options) {
            this.parentView = options.parentView;
            OriginView.prototype.initialize.apply(this, arguments);
        },

        onItemClick: function(event) {
            var $elm = $(event.currentTarget);
            this.selected = $elm.data('colorlabel');
            this.updateClasses();
        },

        updateClasses: function() {
            this.$('.color-item').removeClass('selected');
            this.$('[data-colorlabel="'+this.selected+'"]').addClass('selected');
        },

        onReset: function() {
            var model = this.parentView.model;
            this.selected = null;

            model.save('_colorLabel', '', {
                patch: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });
        },

        onApply: function(event) {
            if (!this.selected) return;
            this.addItem();
        },

        preRender: function() {
            this.selected = -1;
        },

        postRender: function() {
            if (!this.parentView.model.has('_colorLabel')) return;

            var color = this.parentView.model.get('_colorLabel');
            if (color) {
                this.selected = color;
                this.updateClasses();
            }
        },

        applyOnParent: function() {
            var color = this.selected;

            if (this.selected !== -1) {
                this.parentView.$el.attr('data-colorlabel', color);
            } else {
                this.parentView.$el.removeAttr('data-colorlabel');
            }
        },

        addItem: function() {
            var model = this.parentView.model;
            var color = this.selected;

            model.save('_colorLabel', color, {
                patch: false,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });
        },

        onSuccess: function() {
            this.applyOnParent()
            this.remove();
        },

        onError: function(model, response, options) {
            this.remove();
            alert(response);
        }

    }, {
        template: 'colorLabelPopUpView'
    });

    return ColorLabelPopUpView;

});