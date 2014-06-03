define(function(require) {

	var Origin = require('coreJS/app/origin');
	var EditorView = require('coreJS/editor/views/editorView');
  	var EditorModel = require('coreJS/editor/models/editorModel');
  	var EditorMenuSidebarView = require('coreJS/editor/views/editorMenuSidebarView');

  	Origin.on('router:editor', function(location, subLocation, action) {

  		switch (subLocation) {
  			case 'menu':
  				// Create Editor menu view
				Origin.router.createView(EditorView, {
			        currentCourseId: location, 
			        currentView: 'menu', 
			        currentPageId: (action || null)
			    });
			    // update sidebar view
			    Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
			    	"backButtonText": "Back to courses",
			    	"backButtonRoute": "/#/dashboard"
			    });
  				break;
  			case 'page':
  				// Create Editor page view
  				Origin.router.createView(EditorView, {
					currentCourseId: location, 
					currentView: 'page', 
					currentPageId: (action || null)
				});
  				// update sidebar view
				Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
			    	"backButtonText": "Back to course structure",
			    	"backButtonRoute": "/#/editor/" + location + "/menu"
			    });
  				break;
  		}

  	});

});