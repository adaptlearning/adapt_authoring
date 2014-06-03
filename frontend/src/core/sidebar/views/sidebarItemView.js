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
				this.postRender();
			}, this));
		},

		postRender: function() {},

		setupView: function() {
			this.listenTo(Origin, 'sidebar:views:remove', this.remove);
		},

		animateViewIn: function() {
			this.$el.velocity({'left': '0%', 'opacity': 1}, "easeOutQuad");
		}

	});

	return SidebarItemView;

})