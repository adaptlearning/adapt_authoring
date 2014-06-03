define(function(require) {

	var Origin = require('coreJS/app/origin');
	var EditorView = require('coreJS/editor/views/editorView');
  	var EditorModel = require('coreJS/editor/models/editorModel');

  	Origin.on('router:editor', function(location, subLocation, action) {

  		switch (subLocation) {
  			case 'menu':
				Origin.router.createView(EditorView, {
			        currentCourseId: location, 
			        currentView: 'menu', 
			        currentPageId: (action || null)
			    });
  				break;
  			case 'page':
  				Origin.router.createView(EditorView, {
					currentCourseId: location, 
					currentView: 'page', 
					currentPageId: (action || null)
				});
  				break;
  		}

  	});

});