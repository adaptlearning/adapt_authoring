// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  /**
  * This module handles both sections/menus and pages.
  */
  var Origin = require('core/origin');
  var EditorData = require('../global/editorDataLoader');

  var ContentObjectModel = require('core/models/contentObjectModel');
  var EditorMenuSidebarView = require('./views/editorMenuSidebarView');
  var EditorPageComponentListView = require('./views/editorPageComponentListView');
  var EditorPageComponentListSidebarView = require('./views/editorPageComponentListSidebarView');
  var EditorPageEditView = require('./views/editorPageEditView');
  var EditorPageEditSidebarView = require('./views/editorPageEditSidebarView');
  var EditorPageSidebarView = require('./views/editorPageSidebarView');
  var EditorView = require('../global/views/editorView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      var isCOEdit = (route2 === 'page' || route2 === 'menu') && route4 === "edit";
      var isBlockAdd = route2 === 'block' && route4 === 'add';

      if(isCOEdit) {
        renderContentObjectEdit();
      }
      else if(route2 === 'page') {
        renderPageStructure();
      }
      else if(route2 === 'menu') {
        renderMenuStructure();
      }
      else if(isBlockAdd) {
        /**
        * Odd one, but block -> add, so we're actually adding a component
        * We're handling here because it comes from a page
        */
        handleNewComponent();
      }
    });
  });

  function renderContentObjectEdit() {
    (new ContentObjectModel({ _id: Origin.location.route3 })).fetch({
      success: function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        // TODO this should be properly localised
        var type = Origin.location.route2;
        Origin.trigger('location:title:update', { title: 'Editing ' + type + ' - ' + model.get('title') });
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

  function handleNewComponent() {
    var containingBlock = Origin.editor.data.blocks.findWhere({ _id: Origin.location.route3 });
    var layoutOptions = containingBlock.get('layoutOptions');
    var componentsModel = new Backbone.Model({
      title: Origin.l10n.t('app.addcomponent'),
      body: Origin.l10n.t('app.pleaseselectcomponent'),
      _parentId: route3,
      componentTypes: Origin.editor.data.componenttypes.toJSON(),
      layoutOptions: layoutOptions
    });
    Origin.sidebar.addView(new EditorPageComponentListSidebarView({ model: componentsModel }).$el);
    Origin.contentPane.setView(EditorPageComponentListView, { model: componentsModel });
  }
});
