define(function(require) {

    var Origin = require('coreJS/app/origin');

    var EditingOverlayView = Backbone.View.extend({

        className: 'editing-overlay display-none',

        initialize: function() {
            this.listenTo(Origin, 'editingOverlay:views:show', this.showOverlay);
            this.listenTo(Origin, 'editingOverlay:views:hide', this.hideOverlay);
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

            if (this._isVisible) {
                return;
            }

            this.$('.editing-overlay-inner').html(element);
            _.defer(_.bind(function() {
                this.$el.removeClass('display-none');
                this.$el.velocity({left: 0, opacity: 1}, 300, function() {
                    this._isVisible = true;
                });
                this.listenToOnce(Origin, 'remove:views', this.hideOverlay);
            }, this));

        },

        hideOverlay: function() {

            if (!this._isVisible) {
                return;
            }
            
            this.$el.velocity({left: '10%', opacity: 0}, 300, _.bind(function() {
                this.$el.addClass('display-none');
                this._isVisible = false;
            }, this));
            
        },

        resizeOverlay: function() {
            /*var windowHeight = $(window).height();
            var navigationHeight = $('.navigation').outerHeight();
            var locationTitleHeight = $('.location-title').outerHeight();
            this.$el.height(windowHeight - (navigationHeight + locationTitleHeight));*/
        }

    }, {
        template: 'editingOverlay'
    });

    return EditingOverlayView;

});