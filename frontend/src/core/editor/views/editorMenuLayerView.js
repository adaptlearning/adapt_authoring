define(function(require) {

	var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorMenuLayerView = OriginView.extend({

      className: 'editor-menu-layer',

  		preRender: function() {

  		},

  		postRender: function() {

  		}

  	}, {
  		template: 'editorMenuLayer'
  });

  return EditorMenuLayerView;

});
