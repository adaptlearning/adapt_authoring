// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'require',
  'core/origin',
  './global/editorDataLoader',
  './global/editorContentEditRouter',
  './global/editorEventHub',
  './global/editorSidebarLinkRouter',
  './config/index',
  './contentObject/index',
  './course/index',
  './extensions/index',
  './menuSettings/index',
  './selectTheme/index'
], function(require, Origin, EditorData) {
  Origin.on({
    'origin:dataReady login:changed': EditorData.loadGlobalData,
    'router:editor editor:refreshData': EditorData.loadCourseData,
    'editor:resetData': EditorData.reset
  });
});
