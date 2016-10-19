// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var EditorConfigModel = require('editorConfig/models/editorConfigModel');

  var EditorThemingView = require('./views/editorThemingView.js');
  var EditorThemingSidebarView = require('./views/editorThemingSidebarView.js');

  var ROUTE = 'edittheme';

  // Origin.on('editorMenuSidebar:postRender', function() {
  Origin.on('editorCommon:theme', function() {
    Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/' + ROUTE, { trigger: true });
  });

  Origin.on('router:editor', function(route1, route2, route3, route4) {
    if(route2 === ROUTE) {
      var configModel = new EditorConfigModel({ _courseId: route1 });
      configModel.fetch({
        success: function() {
          Origin.sidebar.addView(new EditorThemingSidebarView().$el);
          Origin.editingOverlay.addView(new EditorThemingView({ model: configModel }).$el);
        }
      });
    }
  });
});
