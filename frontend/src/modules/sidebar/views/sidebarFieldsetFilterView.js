// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var Origin = require('core/origin');
	var Backbone = require('backbone');

	var SidebarFieldsetFilterView = Backbone.View.extend({
		className: 'sidebar-row',
		events: {
			'click button': 'onFilterClicked'
		},

		initialize: function() {
			this.onFilterClicked(this); // Hack used for #1184. Sure there must be a better way to turn on.
			this.listenTo(Origin, 'remove:views', this.remove);
			this.render();
		},

		render: function() {
			var data = this.model ? this.model.toJSON() : null;
			var template = Handlebars.templates[this.constructor.template];
			this.$el.html(template(data));
			return this;
		},

		onFilterClicked: function(event) {
			if (this.model.get('_isSelected')) {
				this.model.set('_isSelected', false);
				this.$('i').removeClass('fa-toggle-on');
			} else {
				this.model.set('_isSelected', true);
				this.$('i').addClass('fa-toggle-on');
			}
			
			Origin.trigger('sidebarFieldsetFilter:filterForm', this.model.get('legend'));
			
		}

	}, {
		template: 'sidebarFieldsetFilter'
	});

	return SidebarFieldsetFilterView;

});