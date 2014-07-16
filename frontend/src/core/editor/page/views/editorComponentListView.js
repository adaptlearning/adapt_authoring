define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorComponentListView = EditorOriginView.extend({

    tagName: "div",

    className: "editor-component-list",

    events: {
    },

    preRender: function() {
    },

    postRender: function() {
    }
  },
  {
    template: 'editorComponentList'
  });

  return EditorComponentListView;

});