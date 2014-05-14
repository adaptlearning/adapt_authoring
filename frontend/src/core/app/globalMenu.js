define(function(require) {

	var Origin = require('coreJS/app/origin');

	// Create GlobalMenu object
	var GlobalMenu = {};
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

	// Added for testing purposes
	var itemObject = {
	    "location": "global",
	    "text": "Editor",
	    "icon": "editor",
	    "callbackEvent": "editor:open"
	};

	GlobalMenu.addItem(itemObject);

});