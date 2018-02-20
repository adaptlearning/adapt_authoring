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
            var index = $elm.data('item');

            this.selected = index;
            this.updateClasses();
        },

        updateClasses: function() {
            this.$('.color-item').removeClass('selected').eq(this.selected).addClass('selected');
        },

        onReset: function() {
            var model = this.parentView.model;
            this.selected = -1;

            model.save('_colorLabel', {}, {
                patch: true,
                success: _.bind(this.onSuccess, this),
                error: _.bind(this.onError, this)
            });
        },

        onApply: function(event) {
            if (this.selected === -1) return;
            this.addItem();
        },

        preRender: function() {
            this.selected = -1;
        },

        postRender: function() {
            if (!this.parentView.model.has('_colorLabel')) return;

            var color = this.parentView.model.get('_colorLabel');
            var index = this.model.findByColor(color.background);
            if (index !== -1) {
                this.selected = index;
                this.updateClasses();
            }
        },

        applyOnParent: function() {
            var color = this.model.get('colors')[this.selected];
            var bg = 'inherit';
            var border = 'inherit';

            if (this.selected !== -1) {
                this.parentView.$el.css({
                    'backgroundColor': color.background,
                    'borderColor': color.border
                });
            } else {
                this.parentView.el.removeAttribute('style');
            }
        },

        addItem: function() {
            var model = this.parentView.model;
            var color = this.model.get('colors')[this.selected];

            model.save('_colorLabel', {
                'background': color.background,
                'border': color.border
            }, {
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