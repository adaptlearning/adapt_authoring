define(function(require) {

	var Origin = require('coreJS/app/origin');

	var GlobalMenuItemView = Backbone.View.extend({

		events: {
			'click a.global-menu-item-inner': 'onMenuItemClicked'
		},

		initialize: function() {
			this.render();
			_.defer(_.bind(function() {
				// Setup children items and hover events if the menu item is not a subMenuItem
				if (!this.model.get('_isSubMenuItem')) {
					// Only setup hover events if menu item has children
					if (this.setupChildren()) {
						this.setupHover();
					};
				}
			}, this));
		},

		render: function() {
			var data = this.model.toJSON();
			var template = Handlebars.templates[this.constructor.template];
			this.$el.html(template(data));
			return this;
		},

		setupChildren: function() {

			this.children = this.collection.where({parent: this.model.get('text')});

			if (this.children.length >= 1) {
				return true;
			} else {
				return false;
			}
			
		},

		setupHover: function() {
			// On hover show subItems
			this.$('.global-menu-item-inner').hover(function() {
				console.log('hovered');
			}, function() {
				console.log('hovered off');
			})
		},

		onMenuItemClicked: function(event) {
			event.preventDefault();
			Origin.trigger('globalMenu:' + this.model.get('callbackEvent'));
			Origin.trigger('navigation:globalMenu:toggle');
		}

	}, {
		template: 'globalMenuItem'
	});

	return GlobalMenuItemView;

})