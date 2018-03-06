// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  /**
  * This module handles both sections/menus and pages.
  */
  var Origin = require('core/origin');

  var ContentObjectModel = require('core/models/contentObjectModel');
  var EditorMenuSidebarView = require('./views/editorMenuSidebarView');
  var EditorPageComponentListView = require('./views/editorPageComponentListView');
  var EditorPageEditView = require('./views/editorPageEditView');
  var EditorPageEditSidebarView = require('./views/editorPageEditSidebarView');
  var EditorPageSidebarView = require('./views/editorPageSidebarView');
  var EditorView = require('../global/views/editorView');
  var Helpers = require('../global/helpers');

  Origin.on('editor:contentObject', function(data) {
    if(data.action === 'edit') renderContentObjectEdit(data);
    else if(data.id) renderPageStructure(data);
    else renderMenuStructure(data);
  });

  // component add is just a page overlay view, so handling it here
  Origin.on('editor:block', function(data) {
    if(data.action !== 'add') {
      return;
    }
    var containingBlock = Origin.editor.data.blocks.findWhere({ _id: Origin.location.route3 });
    var layoutOptions = containingBlock.get('layoutOptions');
    var componentsModel = new Backbone.Model({
      title: Origin.l10n.t('app.addcomponent'),
      body: Origin.l10n.t('app.pleaseselectcomponent'),
      _parentId: Origin.location.route3,
      componentTypes: Origin.editor.data.componenttypes.toJSON(),
      layoutOptions: layoutOptions
    });
    Origin.contentPane.setView(EditorPageComponentListView, { model: componentsModel });
  });

  function renderContentObjectEdit(data) {
    (new ContentObjectModel({ _id: data.id })).fetch({
      success: function(model) {
        Helpers.setPageTitle(model, true);
        var form = Origin.scaffold.buildForm({ model: model });
        Origin.sidebar.addView(new EditorPageEditSidebarView({ form: form }).$el);
        Origin.contentPane.setView(EditorPageEditView, { model: model, form: form });
      }
    });
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

    Origin.editor.currentContentObjectId = data.id;
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
