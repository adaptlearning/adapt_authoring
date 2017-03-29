// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Backbone = require('backbone');
	var Origin = require('core/origin');

	var ScaffoldItemsModalView = Backbone.View.extend({

		className: 'scaffold-items-modal',

		initialize: function(options) {
			this.options = options;
			this.listenTo(Origin, 'remove:views', this.remove);
			Origin.trigger('scaffold:increaseActiveModals');
			this.toggleModalOverlay();
			this.render();

			var onKeyUpHandler = _.bind(function(event) {
				var code = event.keyCode ? event.keyCode : event.which;
				if (code === 27) { //escape key
					this.trigger('cancel');
					this.close();
					$(document).off('keyup', onKeyUpHandler);
				}
			}, this);
			$(document).keyup(onKeyUpHandler);
		},

		events: {
			'click .close': function(event) {
				event.preventDefault();

				this.trigger('cancel');
			},
			'click .cancel': function(event) {
				event.preventDefault();
				this.trigger('cancel');
				this.close();
			},
			'click .ok': function(event) {
				event.preventDefault();
				this.trigger('ok');
				this.close();
			}
	    },

		render: function() {
			var data = this.model ? this.model.toJSON() : null;
			var template = Handlebars.templates[this.constructor.template];
			$('body').append(this.$el.html(template(data)));
			return this;
		},

		open: function() {
			var $el = this.$el;
			this.$el.find('.scaffold-items-modal-body').html(this.options.content.render().$el);
			_.defer(function() {
				$el.addClass('show');
			})
		},

		close: function() {
			//Check if the modal should stay open
			if (this._preventClose) {
				this._preventClose = false;
				return;
			}
			Origin.trigger('scaffold:decreaseActiveModals');
			this.toggleModalOverlay();
			this.remove();
		},

		preventClose: function() {
			this._preventClose = true;
		},

		toggleModalOverlay: function() {
			if (Origin.scaffold.getCurrentActiveModals() === 1) {
				if (!Origin.scaffold.isOverlayActive()) {
					Origin.scaffold.setOverlayActive(true);
					$('body').append(Handlebars.templates['scaffoldModalOverlay']);
				}
			} else if (Origin.scaffold.getCurrentActiveModals() === 0) {
				if (Origin.scaffold.isOverlayActive()) {
					Origin.scaffold.setOverlayActive(false);
					$('.scaffold-modal-overlay').remove();
				}
			}
		}

	}, {
		template: 'scaffoldItemsModal'
	});

	return ScaffoldItemsModalView;

});