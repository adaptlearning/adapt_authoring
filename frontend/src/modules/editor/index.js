// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'require',
  'core/origin',
  './global/editorDataLoader',
  './global/editorEventHub',
  './global/editorSidebarLinkRouter',
  './global/editorContentEditRouter',
  './config/index',
  './contentObject/index',
  './course/index',
  './extensions/index',
  './menuSettings/index',
  './selectTheme/index'
], function(require, Origin, EditorData, EventHub, LinkRouter) {
  /**
  * Load the appropriate editor data when needed
  */
  Origin.on({
    'origin:dataReady login:changed': EditorData.loadGlobalData,
    'router:editor editor:refreshData': EditorData.loadCourseData,
    'editor:resetData': EditorData.reset
  });
  Origin.on({
    'router:editor': EventHub,
    'sidebar:link': LinkRouter
  });
});
