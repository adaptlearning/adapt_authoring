// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/app/origin');
  var EditorData = require('../global/editorDataLoader');

  var EditorConfigModel = require('../config/models/editorConfigModel');
  var EditorThemeCollectionView = require('./views/editorThemeCollectionView');
  var EditorThemeCollectionSidebarView = require('./views/editorThemeCollectionSidebarView');

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(function() {
      if(route2 !== 'selecttheme') {
        return;
      }
      (new EditorConfigModel({ _courseId: route1 })).fetch({
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
});
