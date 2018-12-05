// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('./editorDataLoader');

  function EditorSidebarLinkRouter(model) {
    if(Origin.location.module !== 'editor' || model.get('page') === 'back') return;
    EditorData.waitForLoad(function() {
      Origin.router.navigateTo('editor/' + Origin.editor.data.course.get('_id') + '/' + model.get('page'));
    });
  }

  return EditorSidebarLinkRouter;
});
