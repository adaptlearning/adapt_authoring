// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var Helpers = require('./helpers');
  var EditorContentView = require('./views/editorContentView');
  var EditorData = require('./editorDataLoader');

  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ComponentModel = require('core/models/componentModel');
  var ContentObjectModel = require('core/models/contentObjectModel');

  Origin.on('editor:article editor:block editor:component editor:contentObject', function(data) {
    EditorData.waitForLoad(function() {
      if(Origin.location.route4 !== 'edit') {
        return;
      }
      fetchModelForType(data.type, function(model) {
        var form = Origin.scaffold.buildForm({ model: model });
        Helpers.setContentSidebar({ fieldsets: form.fieldsets });
        Origin.contentPane.setView(EditorContentView, { model: model, form: form });
      });
    });
  });

  function fetchModelForType(type, done) {
    if(type === 'page') Model = ContentObjectModel;
    else if(type === 'article') Model = ArticleModel;
    else if(type === 'block') Model = BlockModel;
    else if(type === 'component') Model = ComponentModel;

    (new Model({ _id: Origin.location.route3 })).fetch({ success: done });
  }
});
