// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  /**
  * This module handles both sections/menus and pages.
  */
  var Origin = require('core/app/origin');
  var EditorData = require('../global/editorDataLoader');

  var EditorContentObjectModel = require('./models/editorContentObjectModel');
  var EditorMenuSidebarView = require('./views/editorMenuSidebarView');
  var EditorPageEditView = require('./views/editorPageEditView');
  var EditorPageEditSidebarView = require('./views/editorPageEditSidebarView');
  var EditorPageSidebarView = require('./views/editorPageSidebarView');
  var EditorView = require('../global/views/editorView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      var isPageEdit = route2 === 'page' && route4 === "edit";
      var isMenuEdit = route2 === 'menu' && route4 === "edit";

      if((route2 === 'page' || route2 === 'menu') && route4 === "edit") {
        renderContentObjectEdit();
      }
      else if(route2 === 'page') {
        renderPageStructure();
      }
      else if(route2 === 'menu') {
        renderMenuStructure();
      }
    });
  });

  function renderContentObjectEdit() {
    (new EditorContentObjectModel({ _id: Origin.location.route3 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        // TODO this should be properly localised
        var type = Origin.location.route2;
        Origin.trigger('location:title:update', { title: 'Editing ' + type + ' - ' + contentObjectModel.get('title') });
        Origin.sidebar.addView(new EditorPageEditSidebarView({ form: form }).$el);
        Origin.contentPane.setView(EditorPageEditView, { model: model, form: form });
      }
    });
  }

  function renderPageStructure() {
    Origin.trigger('location:title:update', { title: 'Page editor' });

    Origin.sidebar.addView(new EditorPageSidebarView().$el, {
      "backButtonText": "Back to course structure",
      "backButtonRoute": "/#/editor/" + Origin.location.route1 + "/menu"
    });
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'page',
      currentPageId: (Origin.location.route3 || null)
    });
  }

  function renderMenuStructure() {
    Origin.trigger('location:title:update', { title: 'Menu editor' });

    Origin.editor.currentContentObjectId = Origin.location.route3;
    Origin.editor.scrollTo = 0;

    Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
      "backButtonText": "Back to courses",
      "backButtonRoute": Origin.dashboardRoute || '/#/dashboard'
    });
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'menu',
      currentPageId: (Origin.location.route3 || null)
    });
  }
});
