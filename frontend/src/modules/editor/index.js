// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'require',
  'core/origin',
  './global/editorDataLoader',
  './article/index',
  './block/index',
  './component/index',
  './config/index',
  './contentObject/index',
  './course/index',
  './extensions/index',
  './menuSettings/index',
  './themeEditor/index'
], function(require, Origin, EditorData) {
  // loads editor data
  Origin.on('origin:dataReady login:changed', EditorData.loadGlobalData);
  Origin.on('router:editor editor:refreshData', EditorData.loadCourseData);
  Origin.on('editor:resetData', EditorData.reset);
  // handle routing
  Origin.on('router:editor', function(route1, route2, route3, route4) {
    EditorData.waitForLoad(triggerEvent);
  });
  /**
  * Acts as a sub-router to send out more useful events
  */
  function triggerEvent() {
    var route2 = Origin.location.route2;
    var type;
    switch(route2) {
      case 'article':
      case 'block':
      case 'component':
      case 'config':
      case 'extensions':
      case 'menusettings':
      case 'selecttheme':
        type = route2;
        break;
      case 'page':
      case 'menu':
        type = 'contentObject';
        break;
      case 'settings':
        type = 'course';
        break;
      default:
        // TODO ???
    }
    Origin.trigger('editor:' + type, {
      type: route2,
      id: Origin.location.route3,
      action: Origin.location.route4
    });
  }
});
