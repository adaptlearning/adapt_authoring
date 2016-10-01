// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Origin = require('coreJS/app/origin');
    var Backbone = require('backbone');

    var AssetManagementModalAutofillView = Backbone.View.extend({
        className: 'asset-management-modal-autofill',
        tagName: 'button',

        events: {
            'click': 'onAutofillClicked'
        },

        initialize: function(options) {
            this.options = options;
            this.listenTo(Origin, 'modal:closed', this.remove);
            this.listenTo(Origin, 'remove:views', this.remove);
            this.render();
        },

        render: function() {
            var data = this.options;
            var template = Handlebars.templates['assetManagementModalAutofill'];
            this.$el.html(template(data)).prependTo('.modal-popup-toolbar-buttons');
            return this;
        },

        onAutofillClicked: function(event) {
            event && event.preventDefault();
            // Sometimes the button can be clicked without selecting an asset
            if (this.options.modalView.data) {
                this.options.modalView.data._shouldAutofill = true;
                Origin.trigger('modal:onUpdate');
            } else {
                Origin.trigger('modal:onCancel');
            }
        }
    });

    return AssetManagementModalAutofillView;
});
