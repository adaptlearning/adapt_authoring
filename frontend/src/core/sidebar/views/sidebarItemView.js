define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');

	var SidebarItemView = OriginView.extend({

		className: 'sidebar-item',

		initialize: function() {
			this.render();
			this.listenTo(Origin, 'sidebar:views:animateIn', this.animateViewIn);
			_.defer(_.bind(function() {
				this.setupView();
			}, this));
		},

		setupView: function() {
			this.listenTo(Origin, 'sidebar:views:remove', this.removeView);
		},

		animateViewIn: function() {
			this.$el.velocity({'left': '0%', 'opacity': 1}, "easeOutQuad");
		},

		removeView: function() {
			this.remove();
		}

	});

	return SidebarItemView;

})