define(function(require) {

	var Origin = require('coreJS/app/origin');
	var EditorView = require('editorGlobal/views/editorView');
	var EditorModel = require('editorGlobal/models/editorModel');
	var EditorMenuSidebarView = require('editorMenu/views/editorMenuSidebarView');

	var EditorPageSidebarView = require('editorPage/views/editorPageSidebarView');
	var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');

	var EditorPageEditView = require('editorPage/views/editorPageEditView');
	var EditorPageEditSidebarView = require('editorPage/views/editorPageEditSidebarView');

  var EditorArticleModel = require('editorPage/models/editorArticleModel');

  var EditorArticleEditView = require('editorPage/views/editorArticleEditView');
  var EditorArticleEditSidebarView = require('editorPage/views/editorArticleEditSidebarView');

  var EditorBlockModel = require('editorPage/models/editorBlockModel');

  var EditorBlockEditView = require('editorPage/views/editorBlockEditView');
  var EditorBlockEditSidebarView = require('editorPage/views/editorBlockEditSidebarView');

  var EditorComponentModel = require('editorPage/models/editorComponentModel');

  var EditorComponentEditView = require('editorPage/views/editorComponentEditView');
  var EditorComponentEditSidebarView = require('editorPage/views/editorComponentEditSidebarView');

	Origin.on('router:editor', function(location, subLocation, action) {

    if (location === 'article') {
      var articleModel = new EditorArticleModel({_id: subLocation});
      articleModel.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Editing article - ' + articleModel.get('title')});
          Origin.sidebar.addView(new EditorArticleEditSidebarView({model: articleModel}).$el);
          Origin.editingOverlay.addView(new EditorArticleEditView({model: articleModel}).$el);
        }
      });
      return;
    }

    if (location === 'block') {
      var blockModel = new EditorBlockModel({_id: subLocation});
      blockModel.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Editing block - ' + blockModel.get('title')});
          Origin.sidebar.addView(new EditorBlockEditSidebarView({model: blockModel}).$el);
          Origin.editingOverlay.addView(new EditorBlockEditView({model: blockModel}).$el);
        }
      });
      return;
    }

    if (location === 'component') {
      var componentModel = new EditorComponentModel({_id: subLocation});
      componentModel.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Editing component - ' + componentModel.get('title')});
          Origin.sidebar.addView(new EditorComponentEditSidebarView({model: componentModel}).$el);
          Origin.editingOverlay.addView(new EditorComponentEditView({model: componentModel}).$el);
        }
      });
      return;
    }

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
                Origin.editor.scrollTo = 0;
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