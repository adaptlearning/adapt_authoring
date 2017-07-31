// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('../global/editorDataLoader');

  var ConfigModel = require('core/models/configModel');
  var EditorThemeCollectionView = require('./views/editorThemeCollectionView');
  var EditorThemeCollectionSidebarView = require('./views/editorThemeCollectionSidebarView');

  Origin.on('editor:selecttheme', function(data) {
    var route1 = Origin.location.route1;
    (new ConfigModel({ _courseId: route1 })).fetch({
      success: function(model) {
        Origin.trigger('location:title:update', { title: 'Select theme' });

        var backButtonRoute = "/#/editor/" + route1 + "/menu";
        var backButtonText = "Back to menu";

        if (Origin.previousLocation.route2 === "page") {
          backButtonRoute = "/#/editor/" + route1 + "/page/" + Origin.previousLocation.route3;
          backButtonText = "Back to page";
        }

        Origin.sidebar.addView(new EditorThemeCollectionSidebarView().$el, {
          "backButtonText": backButtonText,
          "backButtonRoute": backButtonRoute
        });
        Origin.contentPane.setView(EditorThemeCollectionView, { model: model });
      }
    });
  });
});
