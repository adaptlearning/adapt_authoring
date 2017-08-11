// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('../global/editorDataLoader');

  var ConfigModel = require('core/models/configModel');
  var EditorMenuSettingsEditView = require('./views/editorMenuSettingsEditView');
  var EditorMenuSettingsEditSidebarView = require('./views/editorMenuSettingsEditSidebarView');

  Origin.on('editor:menusettings', function(data) {
    var route1 = Origin.location.route1;
    (new ConfigModel({ _courseId: route1 })).fetch({
      success: function(model) {
        Origin.trigger('location:title:update', {title: 'Select menu'});

        var backButtonRoute = "/#/editor/" + route1 + "/menu";
        var backButtonText = "Back to menu";
        if (data.type === "page") {
          backButtonRoute = "/#/editor/" + route1 + "/page/" + data.id;
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
