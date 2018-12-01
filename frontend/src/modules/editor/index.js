// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define([
  'require',
  'core/origin',
  './global/editorDataLoader'
], function(require, Origin, EditorData) {
  /*
  * Load the appropriate editor data when needed
  */
  Origin.on({
    'origin:dataReady login:changed': EditorData.loadGlobalData,
    'router:editor editor:refreshData': EditorData.loadCourseData,
    'editor:resetData': EditorData.reset
  });
  /**
  * Make sure we only load the below files AFTER the editor data has finished
  * loading
  */
  require([
    './global/editorContentEditRouter',
    './global/editorEventHub',
    './global/editorSidebarLinkRouter',
    './config/index',
    './contentObject/index',
    './course/index',
    './extensions/index',
    './menuSettings/index',
    './selectTheme/index'
  ]);
});
