// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('core/origin');
	var Backbone = require('backbone');

	var ActionsView = Backbone.View.extend({

		className: 'actions',

		events: {
			'click .actions-apply-button': 'onApplyButtonClicked',
	    },

		initialize: function(options) {
			this.options = options;
			this.listenTo(Origin, 'remove:views', this.remove);
			this.listenTo(Origin, 'actions:applied', this.onActionsApplied);
			this.render();
		},

		render: function() {
			var template = Handlebars.templates['actions'];
			this.$el.html(template(this.options));
			return this;
		},

		onApplyButtonClicked: function(event) {
			event.preventDefault();
			this.$select = this.$('.actions-select');
			var value = this.$select.val();
			// Check the value is not the first option placeholder
			if (value.length > 0) {
				this.$('.actions-apply-button-original').addClass('display-none');
				this.$('.actions-apply-button-apply').html(this.$select.find(':selected').attr('data-apply')).removeClass('display-none');
				// Reset the select option
				this.$select.val(this.$select.find('option:first').val()).attr('disabled', true);
				Origin.trigger('actions:apply', value);
			}
		},

		onActionsApplied: function() {
			// Update the button back
			this.$('.actions-apply-button-original').removeClass('display-none');
			this.$('.actions-apply-button-apply').addClass('display-none');
			this.$select.attr('disabled', false);
		}

	});

	return ActionsView;

});