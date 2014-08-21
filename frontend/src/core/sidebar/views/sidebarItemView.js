define(function(require) {

	var Origin = require('coreJS/app/origin');
	var OriginView = require('coreJS/app/views/originView');

	var SidebarItemView = OriginView.extend({

  	className: 'sidebar-item',

  	events: {
      'click button.editor-common-sidebar-project'      : 'editProject',
      'click button.editor-common-sidebar-config'       : 'editConfiguration',
      'click button.editor-common-sidebar-theme'        : 'editTheme',
      'click button.editor-common-sidebar-extensions'   : 'manageExtensions',
      'click button.editor-common-sidebar-publish'      : 'publishProject',
      'click button.editor-common-sidebar-preview'      : 'previewProject',
      'click button.editor-common-sidebar-close'        : 'closeProject', 
    },

    initialize: function() {
        this.render();
        this.listenTo(Origin, 'sidebar:views:animateIn', this.animateViewIn);
        _.defer(_.bind(function() {
            this.setupView();
            this.postRender();
        }, this));
    },

    postRender: function() {},

    setupView: function() {
        this.listenTo(Origin, 'sidebar:views:remove', this.remove);
    },

    animateViewIn: function() {
        console.log('animate in');
        this.$el.velocity({'left': '0%', 'opacity': 1}, "easeOutQuad");
    },

    editProject: function() {
      Origin.router.navigate('#/project/edit/' + Origin.editor.data.course.get('_id'), {trigger: true});
    },

    editConfiguration: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/config', {trigger: true});
    },

    editTheme: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/theme', {trigger: true});
    },

    manageExtensions: function() {
      Origin.router.navigate('#/editor/' + Origin.editor.data.course.get('_id') + '/extensions', {trigger: true});
    },

  	publishProject: function() {
    	Origin.trigger('editorCommon:publish');
    },

    previewProject: function() {
    	Origin.trigger('editorCommon:preview');
    },

    closeProject: function() {
    	Backbone.history.navigate('#/dashboard');
    }

	});

	return SidebarItemView;

})