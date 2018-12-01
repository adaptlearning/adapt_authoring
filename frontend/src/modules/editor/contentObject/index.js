// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  /**
  * This module handles both sections/menus and pages.
  */
  var Origin = require('core/origin');
  var ContentObjectModel = require('core/models/contentObjectModel');
  var EditorView = require('../global/views/editorView');
  var Helpers = require('../global/helpers');

  var DefaultSidebarOptions = {
    actions: [
      { name: 'preview', type: 'primary', labels: { default: 'app.preview', processing: 'app.previewing' } },
      { name: 'download', type: 'secondary', labels: { default: 'app.download', processing: 'app.downloading' } },
      { name: 'export', type: 'secondary', labels: { default: 'app.export', processing: 'app.exporting' } }
    ],
    links: [
      { name: 'project', page: 'settings', label: 'app.editorsettings' },
      { name: 'config', page: 'config', label: 'app.editorconfig' },
      { name: 'selecttheme', page: 'selecttheme', label: 'app.themepicker' },
      { name: 'menusettings', page: 'menusettings', label: 'app.editormenusettings' },
      { name: 'extensions', page: 'extensions', label: 'app.editorextensions' }
    ]
  };

  Origin.on('editor:contentObject', function(data) {
    if(data.action === 'edit') {
      return;
    }
    var route = function() {
      if(data.id) renderPageStructure(data);
      else renderMenuStructure(data);
    }
    if(!data.id) return route();

    (new ContentObjectModel({ _id: data.id })).fetch({
      success: function(model) {
        data.model = model;
        route();
      }
    });
  });

  function renderPageStructure(data) {
    Origin.trigger('location:title:update', { title: 'Page editor' });

    Origin.sidebar.update(_.extend(DefaultSidebarOptions, {
      backButton: {
        label: "Back to course structure",
        route: "/#/editor/" + Origin.location.route1 + "/menu"
      }
    }));
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'page',
      currentPageId: (data.id || null)
    });
  }

  function renderMenuStructure(data) {
    Origin.trigger('location:title:update', { title: 'Menu editor' });

    Origin.editor.scrollTo = 0;

    Origin.sidebar.update(_.extend(DefaultSidebarOptions, {
      backButton: {
        label: "Back to courses",
        route: Origin.dashboardRoute || '/#/dashboard'
      }
    }));
    Origin.contentPane.setView(EditorView, {
      currentCourseId: Origin.location.route1,
      currentView: 'menu',
      currentPageId: (data.id || null)
    });
  }
});
