// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

	var Origin = require('core/origin');
	var Backbone = require('backbone');

	var LocationTitleView = Backbone.View.extend({

		el: '.location-title',

		initialize: function() {
			this.listenTo(Origin, 'location:title:update', this.render);
			this.listenTo(Origin, 'location:title:hide', this.onHideTitle);
			this.render();
		},

		render: function(data) {
		    var template = Handlebars.templates[this.constructor.template];
		    this.$el.html(template(data));
		    _.defer(_.bind(function() {
		    	this.postRender();
		    }, this));
		    return this;
		},

		postRender: function() {
			this.$el.removeClass('display-none');
			Origin.trigger('location:title:postRender', this);
		},

		onHideTitle: function() {
			this.$el.addClass('display-none');
		}

	}, {
		template: 'locationTitle'
	});

	return LocationTitleView;

});