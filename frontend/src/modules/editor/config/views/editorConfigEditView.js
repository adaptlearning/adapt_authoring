// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorContentView = require('../../global/views/editorContentView');

  var EditorConfigEditView = EditorContentView.extend({
    className: "config-edit",
    tagName: "div",

    getAttributesToSave: function() {
      var changed = this.model.changedAttributes();
      if(!changed) {
        return null;
      }
      return _.extend(changed, {
        _id: this.model.get('_id'),
        _courseId: this.model.get('_courseId')
      });
    }
  });

  return EditorConfigEditView;
});
