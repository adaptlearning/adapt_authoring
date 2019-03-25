// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('../global/editorDataLoader');

  var ConfigModel = require('core/models/configModel');
  var EditorThemeCollectionView = require('./views/editorThemeCollectionView');
  var EditorThemeCollectionSidebarView = require('./views/editorThemeCollectionSidebarView');
  var Helpers = require('../global/helpers');

  Origin.on('editor:selecttheme', function(data) {
    var route1 = Origin.location.route1;
    (new ConfigModel({ _courseId: route1 })).fetch({
      success: function(model) {
        Helpers.setPageTitle(model);

        var backButtonRoute = "/#/editor/" + route1 + "/menu";
        var backButtonText = Origin.l10n.t('app.backtomenu');
        if (Origin.previousLocation.route2 === "page") {
          backButtonRoute = "/#/editor/" + route1 + "/page/" + Origin.previousLocation.route3;
          backButtonText = Origin.l10n.t('app.backtopage');
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
