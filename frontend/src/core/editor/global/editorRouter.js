// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');

  var Origin = require('coreJS/app/origin');

  var EditorView = require('editorGlobal/views/editorView');
  var EditorModel = require('editorGlobal/models/editorModel');

  var ProjectModel = require('coreJS/project/models/projectModel');
  var ProjectDetailView = require('coreJS/project/views/projectDetailView');
  var ProjectDetailEditSidebarView = require('coreJS/project/views/projectDetailEditSidebarView');

  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorCourseModel = require('editorCourse/models/editorCourseModel');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');

  var EditorPageSidebarView = require('editorPage/views/editorPageSidebarView');
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
  var EditorComponentListView = require('editorPage/views/editorComponentListView');
  var EditorComponentListSidebarView = require('editorPage/views/editorComponentListSidebarView');

  var EditorExtensionsEditView = require('editorExtensions/views/editorExtensionsEditView');
  var EditorExtensionsEditSidebarView = require('editorExtensions/views/editorExtensionsEditSidebarView');

  var EditorConfigEditView = require('editorConfig/views/editorConfigEditView');
  var EditorConfigEditSidebarView = require('editorConfig/views/editorConfigEditSidebarView');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');
  var EditorConfigCollection = require('editorConfig/collections/editorConfigCollection');

  var EditorThemeTypeModel = require('editorTheme/models/editorThemeTypeModel');
  var EditorThemeCollectionView = require('editorTheme/views/editorThemeCollectionView');
  var EditorThemeCollectionSidebarView = require('editorTheme/views/editorThemeCollectionSidebarView');

  var EditorMenuSidebarView = require('editorMenu/views/editorMenuSidebarView');
  var EditorMenuSettingsEditView = require('editorMenuSettings/views/editorMenuSettingsEditView');
  var EditorMenuSettingsEditSidebarView = require('editorMenuSettings/views/editorMenuSettingsEditSidebarView');

  /**
  * Main routing function
  */
  var loc;

  function route(location) {
    loc = location
    // shortcuts
    var isAdd = loc.action === 'add';
    var isEdit = loc.action === 'edit';

    switch (loc.type) {
      case 'article':
        if(isEdit) handleArticleEditRoute();
        break;

      case 'block':
        if(isAdd) handleBlockAddRoute();
        if(isEdit) handleBlockEditRoute();
        break;

      case 'component':
        handleComponentRoute();
        break;

      case 'settings':
        handleSettingsRoute();
        break;

      case 'config':
        handleConfigRoute();
        break;

      case 'selecttheme':
        handleThemeSelectRoute();
        break;

      case 'extensions':
        handleExtensionsRoute();
        break;

      case 'menusettings':
        handleMenuSettingsRoute();
        break;

      case 'menu':
        if(isEdit) handleMenuEditRoute();
        else handleMenuRoute();
        break;

      case 'page':
        if(isEdit) handlePageEditRoute();
        else handlePageRoute();
        break;
    }
  }

  /*
  * Set the page title based on location.
  * Accepts backbone model, or object like so { title: '' }
  */
  function updatePageTitle(model) {
    var titleKey = (loc.type === 'page' && loc.action === 'edit') ?
      'editor' + loc.type + 'settings' :
      'editor' + loc.type;
    var modelTitle = model && model.get && model.get('title');
    var langString = window.polyglot.t('app.' + titleKey);

    var crumbs = ['dashboard'];
    // menu editor
    if(loc.type !== 'menu') {
      crumbs.push('course');
    }
    // page editor
    if(loc.action === 'edit') {
      var page = getNearestPage(model);
      crumbs.push({
        title: window.polyglot.t('app.editorpage'),
        url: '#/editor/' + page.get('_courseId') + '/page/' + page.get('_id')
      });
    }
    // this page type title
    crumbs.push({ title: langString });

    Origin.trigger('location:title:update', {
      breadcrumbs: crumbs,
      title: modelTitle || langString
    });
  }

  /**
  * Finds the parent page
  */
  getNearestPage = function(model) {
    var map = {
      'component': 'components',
      'block': 'blocks',
      'article': 'articles',
      'page': 'contentObjects'
    };
    var mapKeys = Object.keys(map);
    while(model.get('_type') !== 'page') {
      var parentType = mapKeys[_.indexOf(mapKeys, model.get('_type')) + 1];
      var parentCollection = Origin.editor.data[map[parentType]];
      model = parentCollection.findWhere({ _id: model.get('_parentId') });
    }
    return model;
  }

  /**
  * Calculates back button label/href based on location
  */
  function getBackButtonData() {
    switch(loc.type) {
      case 'selecttheme':
      case 'extensions':
      case 'menusettings':
        var backButtonRoute = '/#/editor/' + loc.course + '/menu';
        var backButtonText = window.polyglot.t('app.backtomenu');
        // FIXME need to figure this out without a previousLocation
        if (Origin.previousLocation.route2 === 'page') {
          backButtonRoute = '/#/editor/' + loc.course + '/page/' + Origin.previousLocation.route3;
          backButtonText = window.polyglot.t('app.backtopage');
        }
        return {
          backButtonText: backButtonText,
          backButtonRoute: backButtonRoute
        };
      case 'menu':
        return {
          backButtonText: window.polyglot.t('app.backtocourses'),
          backButtonRoute: Origin.dashboardRoute || '/#/dashboard'
        };
      default:
        return {};
    }
  }

  function getConfigModel() {
    return new EditorConfigModel({ _courseId: loc.course });
  }

  function fetchModel(model, callback) {
    model.fetch({
      success: callback,
      error: function() {
        Origin.Notify.alert({
          type: 'error',
          text: window.polyglot.t('app.errorgeneric')
        });
      }
    });
  }

  /**
  * Handles Initialising and rendering of editor pages
  */
  function setUpBasicEditorPage(model, sidebarClass, editorClass, pageTitleData) {
    updatePageTitle(pageTitleData || model);
    var viewData = {
      model: model,
      form: getFormForModel(model)
    };
    Origin.editingOverlay.addView(new editorClass(viewData).$el);
    Origin.sidebar.addView(new sidebarClass(viewData).$el, getBackButtonData());
  }

  function getFormForModel(model) {
    switch(loc.type) {
      case 'selecttheme':
      case 'extensions':
      case 'menusettings':
        // these have no form data
        break;
      default:
        return Origin.scaffold.buildForm({ model: model });
    }
  }

  /**
  * Individual route handlers
  */

  function handleArticleEditRoute() {
    fetchModel(new EditorArticleModel({ _id: loc.id }), function(model) {
      setUpBasicEditorPage(model, EditorArticleEditSidebarView, EditorArticleEditView);
    });
  }

  function handleBlockAddRoute() {
    var containingBlock = Origin.editor.data.blocks.findWhere({ _id: loc.id });
    var model = new Backbone.Model({
      title: window.polyglot.t('app.addcomponent'),
      body: window.polyglot.t('app.pleaseselectcomponent'),
      _parentId: loc.id,
      componentTypes: Origin.editor.data.componentTypes.toJSON(),
      layoutOptions: containingBlock.get('layoutOptions')
    });
    Origin.sidebar.addView(new EditorComponentListSidebarView({ model: model }).$el);
    Origin.editingOverlay.addView(new EditorComponentListView({ model: model }).$el);
  }

  function handleBlockEditRoute() {
    fetchModel(new EditorBlockModel({ _id: loc.id }), function(model) {
      setUpBasicEditorPage(model, EditorBlockEditSidebarView, EditorBlockEditView);
    });
  }

  function handleComponentRoute() {
    fetchModel(new EditorComponentModel({ _id: loc.id }), function(model) {
      setUpBasicEditorPage(model, EditorComponentEditSidebarView, EditorComponentEditView);
    });
  }

  function handleSettingsRoute() {
    fetchModel(new ProjectModel({ _id: loc.course }), function(model) {
      var titleData = { title: window.polyglot.t('app.editorsettingstitle') };
      setUpBasicEditorPage(model, ProjectDetailEditSidebarView, ProjectDetailView, titleData);
    });
  }

  function handleConfigRoute() {
    fetchModel(getConfigModel(), function(model) {
      var titleData = { title: window.polyglot.t('app.editorconfigtitle') };
      setUpBasicEditorPage(model, EditorConfigEditSidebarView, EditorConfigEditView);
    });
  }

  function handleThemeSelectRoute() {
    fetchModel(getConfigModel(), function(model) {
      setUpBasicEditorPage(model, EditorThemeCollectionSidebarView, EditorThemeCollectionView);
    });
  }

  function handleExtensionsRoute() {
    var titleData = { title: window.polyglot.t('app.editorextensionstitle') };
    var model = new Backbone.Model({ _id: loc.course });
    setUpBasicEditorPage(model, EditorExtensionsEditSidebarView, EditorExtensionsEditView, titleData);
  }

  function handleMenuSettingsRoute() {
    fetchModel(getConfigModel(), function(model) {
      var titleData = { title: window.polyglot.t('app.editormenusettingstitle') };
      setUpBasicEditorPage(model, EditorMenuSettingsEditSidebarView, EditorMenuSettingsEditView, titleData);
    });
  }

  function handleMenuRoute() {
    // If loc.id is an id set it to the currentContentObjectId
    Origin.editor.currentContentObjectId = (loc.id) ? loc.id : undefined;
    Origin.editor.scrollTo = 0;

    fetchModel(new EditorCourseModel({ _id: loc.course }), function(model) {
      updatePageTitle(model);
      Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
        backButtonText: window.polyglot.t('app.backtocourses'),
        backButtonRoute: Origin.dashboardRoute || '/#/dashboard'
      });
      Origin.router.createView(EditorView, {
        currentCourseId: loc.course,
        currentView: 'menu',
        currentPageId: (loc.id || null)
      });
    });
  }

  function handleMenuEditRoute() {
    fetchModel(new EditorContentObjectModel({ _id: loc.id }), function(model) {
      setUpBasicEditorPage(model, EditorPageEditSidebarView, EditorPageEditView);
    });
  }

  function handlePageRoute() {
    fetchModel(new EditorContentObjectModel({ _id: loc.id }), function(model) {
      updatePageTitle(model);
      Origin.sidebar.addView(new EditorPageSidebarView().$el, {
        backButtonText: window.polyglot.t('app.backtocoursestructure'),
        backButtonRoute: '/#/editor/' + loc.course + '/menu'
      });
      Origin.router.createView(EditorView, {
        currentCourseId: loc.course,
        currentView: 'page',
        currentPageId: (loc.id || null)
      });
    });
  }

  function handlePageEditRoute() {
    fetchModel(new EditorContentObjectModel({ _id: loc.id }), function(model) {
      setUpBasicEditorPage(model, EditorPageEditSidebarView, EditorPageEditView);
    });
  }

  /**
  * Exports
  */
  return {
    route: route
  };
});
