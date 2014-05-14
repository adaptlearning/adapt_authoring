define(function(require) {

	var Origin = require('coreJS/app/origin');
	var GlobalMenuView = require('coreJS/globalMenu/views/globalMenuView');

	// Create GlobalMenu object
	var GlobalMenu = {};
	var _isActive = false;
	// Create GlobalMenu Store
	var GlobalMenuStore = new Backbone.Collection();

	GlobalMenu.addItem = function(itemObject) {
		// Return if itemObject doesn't have all arguments
		console.log(itemObject)
		if (_.size(itemObject) !== 4) {
			return console.log('Cannot add Global Menu item', itemObject.text);
		}

		// Push item to GlobalMenuStore
		GlobalMenuStore.add(itemObject);

		console.log(GlobalMenuStore);

	}

	// Listen to navigation event to toggle
	Origin.on('navigation:globalMenu:toggle', function() {
		if (_isActive === true) {
			_isActive = false;
			Origin.trigger('globalMenu:globalMenuView:remove');
		} else {
			_isActive = true;
			new GlobalMenuView({collection: GlobalMenuStore});
		}
	});


	Origin.currentLocation = 'global';
	// Added for testing purposes
	var itemObject = {
	    "location": "global",
	    "text": "Editor",
	    "icon": "editor",
	    "callbackEvent": "editor:open"
	};

	Origin.on('app:dataReady', function() {
		GlobalMenu.addItem(itemObject);
	});

});