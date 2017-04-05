// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('./global/editorDataLoader');
  // load the submodules
  require([
    './article/index',
    './block/index',
    './component/index',
    './config/index',
    './contentObject/index',
    './course/index',
    './extensions/index',
    './menuSettings/index',
    './selectTheme/index'
  ]);
  // loads editor data
  Origin.on('origin:dataReady login:changed', EditorData.loadGlobalData);
  Origin.on('router:editor editor:refreshData', EditorData.loadCourseData);
  Origin.on('editor:resetData', EditorData.reset);
});
