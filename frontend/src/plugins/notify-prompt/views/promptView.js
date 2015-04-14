// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var Backbone = require('backbone');
	var Origin = require('coreJS/app/origin');
	var Notify = require('coreJS/notify/notify');

	var PromptView = Backbone.View.extend({
		className: 'notify',

		initialize: function() {
			this.listenTo(Origin, 'remove', this.remove);
      		this.listenTo(Origin, 'device:resize', this.resetNotifySize);
			this.initButtonIds();
			this.render();
		},

		events: {
			'click .notify-popup-alert-button': 'handleButtonClick',
			'click .notify-popup-prompt-button': 'handleButtonClick',
			'click .notify-popup-done': 'handleButtonClick'
		},

		initButtonIds: function() {
			var prompts = this.model.get('_prompts');
			for(var i = 0, len = prompts.length; i < len; i++) {
				prompts[i]._index = i;
			}
		},

		render: function() {
			var data = this.model.toJSON();
            var template = Handlebars.templates['prompt'];
            this.$el.html(template(data)).appendTo('body');
            this.showNotify();
            this.bringFocusToButton();
            return this;
		},

		handleButtonClick: function(event) {
			event.preventDefault();
			this.handleCallback($(event.target).attr('data-index'));
			this.closeNotify();
		},

		/**
		* Currently supports:
		* - Prompt/button specific callback
		* - Generic callback
		*/
		handleCallback: function(buttonIndex) {
			var prompt = this.model.get('_prompts') && this.model.get('_prompts')[buttonIndex];

			// TODO: refactor, add error checking
			if(prompt && prompt._callback) {
				return prompt._callback.apply(this);
			} else if(this.model.get('_callback')) {
				return this.model.get('_callback').apply(this);
			} else {
				return Notify.debug('NotifyView.handleCallback: no callback specified');
			}

			// TODO: do we need an event triggered? are generic close events useful?
		},

		onCloseButtonClicked: function(event) {
			event.preventDefault();
			Notify.trigger('viewClosed');
			this.closeNotify();
		},

		onSelectComponent: function(event) {
			event.preventDefault();

			$('.notify-popup-component-option').removeClass('selected');
			$(event.currentTarget).addClass('selected');

			this.model.set('component', $(event.currentTarget).attr('data-component'));
		},

		onSelectLayout: function(event) {
			event.preventDefault();

			$('.notify-popup-layout-option').removeClass('selected');
			$(event.currentTarget).addClass('selected');

			this.model.set('layout', $(event.currentTarget).attr('data-layout'));
		},

		resetNotifySize: function() {
			$('.notify-popup').removeAttr('style');
			this.resizeNotify(true);
		},

		resizeNotify: function(noAnimation) {
			var windowHeight = $(window).height();
			var notifyHeight = this.$('.notify-popup').height();
			var animationSpeed = 400;
			if (notifyHeight > windowHeight) {
				this.$('.notify-popup').css({
					'height':'100%',
					'top':0,
					'overflow-y': 'scroll',
					'-webkit-overflow-scrolling': 'touch',
					'opacity': 1
				});
			} else {
				if (noAnimation) {
					var animationSpeed = 0;
				}
				this.$('.notify-popup').css({
					'margin-top': -(notifyHeight/2)-50, 'opacity': 0
				}).velocity({
					'margin-top': -(notifyHeight/2), 'opacity':1
				}, animationSpeed);
			}
		},

		showNotify: function() {
			this.resizeNotify();
			this.$('.notify-popup').show();
			this.$('.notify-shadow').fadeIn('fast');
		},

		closeNotify: function (event) {
			this.$el.fadeOut('fast', _.bind(function() {
				this.remove();
			}, this));
			Origin.trigger('popup:closed');
		},

        bringFocusToButton: function() {
            this.$('.notify-popup-button').first().focus();
        }
	});

	return PromptView;
});
