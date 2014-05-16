define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');

	var SidebarItemView = OriginView.extend({

		initialize: function() {
			this.listenTo(Origin, 'sidebar:views:remove', this.removeView);
			this.render();
		},

		removeView: function() {
			this.$el.css('position', 'relative').animate({'left': '-100%'}, _.bind(function() {
				this.remove();
			}, this));
		}

	});

	return SidebarItemView;

})