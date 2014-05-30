define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');

	var SidebarItemView = OriginView.extend({

		className: 'sidebar-item',

		initialize: function() {
			this.render();
			_.defer(_.bind(function() {
				this.setupView();
			}, this));
		},

		setupView: function() {
			this.listenTo(Origin, 'sidebar:views:remove', this.removeView);
			this.$el.velocity({'left': '0%', 'opacity': 1}, 800, "easeOutQuad");
		},

		removeView: function() {
			this.$el.velocity({'left': '-100%', 'opacity': 0}, _.bind(function() {
				this.remove();
			}, this));
		}

	}, {
		template: 'sidebarTestView'
	});

	return SidebarItemView;

})