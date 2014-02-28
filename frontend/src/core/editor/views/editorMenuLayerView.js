define(function(require) {

	var AdaptBuilder = require('coreJS/app/adaptBuilder');
  	var BuilderView = require('coreJS/app/views/builderView');

  	var EditorMenuLayerView = BuilderView.extend({

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