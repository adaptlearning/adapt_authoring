define(function(require) {
	
	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');

	var GlobalMenuView = OriginView.extend({

		className: 'global-menu',

		preRender: function() {
			console.log('booom');
		}

	}, {
		template: 'globalMenu'
	});

	return GlobalMenuView;

})