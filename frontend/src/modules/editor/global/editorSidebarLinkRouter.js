// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('./editorDataLoader');

  Origin.on('sidebar:link', function(page) {
    EditorData.waitForLoad(function() {
      Origin.router.navigateTo('editor/' + Origin.editor.data.course.get('_id') + '/' + page);
    });
  });
});
