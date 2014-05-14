define(function(require) {
	
	var Origin = require('coreJS/app/origin');
	var GlobalMenuItemView = require('coreJS/globalMenu/views/globalMenuItemView');

	var GlobalMenuView = Backbone.View.extend({

		className: 'global-menu',

		initialize: function() {
			this.listenTo(Origin, 'globalMenu:globalMenuView:remove', this.remove);
			this.render();
		},

		render: function() {
			var template = Handlebars.templates[this.constructor.template];
			this.$el.html(template());
			_.defer(_.bind(function() {
				this.postRender();
			}, this));
			return this;
		},

		postRender: function() {

			this.collection.each(function(menuItem) {

				var location = menuItem.get('location');
				var _isSubItem = menuItem.get('_isSubMenuItem');
				// Check location and only render if location is either global or current location
				if (location === 'global' || location === Origin.currentLocation) {
					// Only load view if it's not a subItem
					if (_isSubItem === false) {
						this.$('.global-menu-inner').append(new GlobalMenuItemView({
							collection: this.collection,
							model: menuItem
						}).$el);
					}
				}
				
			}, this);

		}

	}, {
		template: 'globalMenu'
	});

	return GlobalMenuView;

})