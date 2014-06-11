define(function(require) {

	var Origin = require('coreJS/app/origin');
	var EditorView = require('editorGlobal/views/editorView');
  	var EditorModel = require('editorGlobal/models/editorModel');
  	var EditorMenuSidebarView = require('editorMenu/views/editorMenuSidebarView');
  	var EditorPageSidebarView = require('editorPage/views/editorPageSidebarView');
  	var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  	var EditorPageEditView = require('editorPage/views/editorPageEditView');
  	var EditorPageEditSidebarView = require('editorPage/views/editorPageEditSidebarView');

  	Origin.on('router:editor', function(location, subLocation, action) {

  		switch (subLocation) {
  			case 'menu':
  				// Update page title
  				Origin.trigger('location:title:update', {title: 'Menu editor'});
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
  				// Update page title
  				Origin.trigger('location:title:update', {title: 'Page editor'});
  				// Create Editor page view
  				Origin.router.createView(EditorView, {
					currentCourseId: location, 
					currentView: 'page', 
					currentPageId: (action || null)
				});
  				// update sidebar view
				Origin.sidebar.addView(new EditorPageSidebarView().$el, {
			    	"backButtonText": "Back to course structure",
			    	"backButtonRoute": "/#/editor/" + location + "/menu"
			    });
  				break;
  			case 'edit':
  				var contentObjectModel = new EditorContentObjectModel({_id: location});
  				contentObjectModel.fetch({
  					success: function() {
  						Origin.trigger('location:title:update', {title: 'Editing page - ' + contentObjectModel.get('title')});
						  Origin.sidebar.addView(new EditorPageEditSidebarView({model: contentObjectModel}).$el);
						  Origin.editingOverlay.addView(new EditorPageEditView({model: contentObjectModel}).$el);
  					}
  				})
				break;
  		}

  	});

});