// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  /**
  * This module handles both sections/menus and pages.
  */
  var Origin = require('core/origin');
  var ContentObjectModel = require('core/models/contentObjectModel');
  var EditorMenuSidebarView = require('./views/editorMenuSidebarView');
  var EditorPageEditView = require('./views/editorPageEditView');
  var EditorPageEditSidebarView = require('./views/editorPageEditSidebarView');
  var EditorPageSidebarView = require('./views/editorPageSidebarView');
  var EditorView = require('../global/views/editorView');
  var Helpers = require('../global/helpers');

  Origin.on('editor:contentObject', function(data) {
    var route = function() {
      if(data.action === 'edit') renderContentObjectEdit(data);
      else if(data.id) renderPageStructure(data);
      else renderMenuStructure(data);
    }
    if(!data.id) {
      return route();
    }
    (new ContentObjectModel({ _id: data.id })).fetch({
      success: function(model) {
        data.model = model;
        route();
      }
    });
  });

  function renderContentObjectEdit(data) {
    Helpers.setPageTitle(data.model, true);
    var form = Origin.scaffold.buildForm({ model: data.model });
    Origin.sidebar.addView(new EditorPageEditSidebarView({ form: form }).$el);
    Origin.contentPane.setView(EditorPageEditView, { model: data.model, form: form });
  }

  function renderPageStructure(data) {
    Origin.trigger('location:title:update', { title: 'Page editor' });

    Origin.sidebar.addView(new EditorPageSidebarView().$el, {
      "backButtonText": "Back to course structure",
      "backButtonRoute": "/#/editor/" + Origin.location.route1 + "/menu"
    });
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'page',
      currentPageId: (data.id || null)
    });
  }

  function renderMenuStructure(data) {
    Origin.trigger('location:title:update', { title: 'Menu editor' });

    Origin.editor.scrollTo = 0;

    Origin.sidebar.addView(new EditorMenuSidebarView().$el, {
      "backButtonText": "Back to courses",
      "backButtonRoute": Origin.dashboardRoute || '/#/dashboard'
    });
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'menu',
      currentPageId: (data.id || null)
    });
  }
});
