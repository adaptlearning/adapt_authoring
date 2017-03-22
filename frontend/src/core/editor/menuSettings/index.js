// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('origin');
  var Helpers = require('../global/helpers');

  var EditorConfigModel = require('./views/editorConfigModel');
  var EditorMenuSettingsEditView = require('./views/editorMenuSettingsEditView');
  var EditorMenuSettingsEditSidebarView = require('./views/editorMenuSettingsEditSidebarView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    if(route2 !== 'menuSettings') {
      return;
    }
    (new EditorConfigModel({ _courseId: route1 })).fetch({
      success: function(model) {
        Origin.trigger('location:title:update', {title: 'Select menu'});

        var backButtonRoute = "/#/editor/" + route1 + "/menu";
        var backButtonText = "Back to menu";
        if (Origin.previousLocation.route2 === "page") {
          backButtonRoute = "/#/editor/" + route1 + "/page/" + Origin.previousLocation.route3;
          backButtonText = "Back to page";
        }
        Origin.sidebar.addView(new EditorMenuSettingsEditSidebarView().$el, {
          "backButtonText": backButtonText,
          "backButtonRoute": backButtonRoute
        });
        Origin.contentPane.setView(EditorMenuSettingsEditView, { model: model });
      }
    });
  });
});
