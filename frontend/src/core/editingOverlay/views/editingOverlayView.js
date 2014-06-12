define(function(require) {

	var Origin = require('coreJS/app/origin');

	var EditingOverlayView = Backbone.View.extend({

		className: 'editing-overlay',

		initialize: function() {
			this.listenTo(Origin, 'editingOverlay:views:show', this.showOverlay);
			this.listenTo(Origin, 'editingOverlay:views:hide', this.hideOverlay)
			$(window).on("resize", _.bind(this.resizeOverlay, this));
			this.resizeOverlay();
			this.render();
		},

		render: function() {
			var template = Handlebars.templates[this.constructor.template];
			this.$el.html(template());
			_.defer(_.bind(function() {
				this.postRender();
			}, this));
			return this;
		},

		postRender: function() {
			
		},

		showOverlay: function(element) {
			this.$('.editing-overlay-inner').html(element);
			_.defer(_.bind(function() {
				this.$el.velocity({left: 0, opacity: 1});
			}, this));
		},

		hideOverlay: function() {
			this.$el.velocity({left: '100%', opacity: 0});
		},

		resizeOverlay: function() {
			var windowHeight = $(window).height();
			var navigationHeight = $('.navigation').outerHeight();
			var locationTitleHeight = $('.location-title').outerHeight();
			this.$el.height(windowHeight - (navigationHeight + locationTitleHeight));
		}

	}, {
		template: 'editingOverlay'
	});

	return EditingOverlayView;

});