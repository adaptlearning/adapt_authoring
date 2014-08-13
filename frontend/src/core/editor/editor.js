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

  var EditorExtensionsEditView = require('editorExtensions/views/editorExtensionsEditView');
  var EditorExtensionsEditSidebarView = require('editorExtensions/views/editorExtensionsEditSidebarView');

  var EditorConfigEditView = require('editorConfig/views/editorConfigEditView');
  var EditorConfigEditSidebarView = require('editorConfig/views/editorConfigEditSidebarView');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorConfigCollection = require('editorConfig/collections/editorConfigCollection');

  var EditorThemeEditView = require('editorTheme/views/editorThemeEditView');
  var EditorThemeEditSidebarView = require('editorTheme/views/editorThemeEditSidebarView');

  var EditorComponentListView = require('editorPage/views/editorComponentListView');
  var EditorComponentListSidebarView = require('editorPage/views/editorComponentListSidebarView');

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
      // Display editing a component
      var componentModel = new EditorComponentModel({_id: subLocation});
      componentModel.fetch({
        success: function() {
          Origin.trigger('location:title:update', {title: 'Editing ' + componentModel.get('_componentType').displayName.toLowerCase() + ' component - ' + componentModel.get('title')});
          Origin.sidebar.addView(new EditorComponentEditSidebarView({model: componentModel}).$el);
          Origin.editingOverlay.addView(new EditorComponentEditView({model: componentModel}).$el);
        }
      });
      return;
    }

		switch (subLocation) {
      case 'config':
        // subLocation is the courseid
        // var collection = new EditorConfigCollection();
        // collection.findWhere({_courseId: location});

        var configModel = new EditorConfigModel({_id: location});

        configModel.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Edit configuration'});
            Origin.sidebar.addView(new EditorConfigEditSidebarView().$el);
            Origin.editingOverlay.addView(new EditorConfigEditView({model: configModel}).$el);
          }
        });
        break;

      case 'theme':
        var configModel = new EditorConfigModel({_id: location});

        configModel.fetch({
          success: function() {
            Origin.trigger('location:title:update', {title: 'Select theme'});
            Origin.sidebar.addView(new EditorThemeEditSidebarView().$el);
            Origin.editingOverlay.addView(new EditorThemeEditView({model: configModel}).$el);
          }
        });
        break;

      case 'extensions':
        Origin.trigger('location:title:update', {title: 'Manage extensions'});

        var extensionsModel = new Backbone.Model({_id: location});

        // Setup back button breadcrumb

        // Check whether the user came from the page editor or menu editor
        var backButtonRoute = "/#/editor/" + location + "/menu";
        var backButtonText = "Back to menu";

        if (Origin.previousLocation.route2 === "page") {
            backButtonRoute = "/#/editor/" + location + "/page/" + Origin.previousLocation.route3;
            backButtonText = "Back to page";
        }

        var optionsObject = {
            "backButtonText": backButtonText,
            "backButtonRoute": backButtonRoute
        };

        Origin.sidebar.addView(new EditorExtensionsEditSidebarView().$el, optionsObject);
        Origin.editingOverlay.addView(new EditorExtensionsEditView({model: extensionsModel}).$el);

        break;

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
				});
        break;
      case 'component':
        // If adding a new component

        // Find block so we can get layout options
        var containingBlock = Origin.editor.data.blocks.findWhere({_id: location});

        var layoutOptions = containingBlock.get('layoutOptions');

        var componentSelectModel = new Backbone.Model({
          title: window.polyglot.t('app.addcomponent'),
          body: window.polyglot.t('app.pleaseselectcomponent'),
          _parentId: location,
          componentTypes: Origin.editor.data.componentTypes.toJSON(),
          layoutOptions: layoutOptions
        })
        Origin.sidebar.addView(new EditorComponentListSidebarView({
          model: componentSelectModel
        }).$el);
        Origin.editingOverlay.addView(new EditorComponentListView({
          model: componentSelectModel
        }).$el);

        break;
		}

	});

});
