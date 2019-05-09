// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorConfigModel = require('core/models/configModel');
  var EditorThemingView = require('./views/editorThemingView.js');
  var EditorThemingSidebarView = require('./views/editorThemingSidebarView.js');
  var ROUTE = 'selecttheme';

  Origin.on('editorCommon:theme', function() {
    Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/' + ROUTE, { trigger: true });
  });

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    if (route2 === ROUTE) {
      var configModel = new EditorConfigModel({ _courseId: route1 });
      configModel.fetch({
        success: function() {
          Origin.sidebar.addView(new EditorThemingSidebarView().$el);
          Origin.contentPane.setView(EditorThemingView, { model: configModel });
        }
      });
    }
  });
});
