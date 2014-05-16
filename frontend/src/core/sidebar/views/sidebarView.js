define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');

	var Sidebar = OriginView.extend({

		className: 'sidebar',

		initialize: function() {
			this.render();
		}

	}, {
		template: 'sidebarView'
	});

	return Sidebar;

});