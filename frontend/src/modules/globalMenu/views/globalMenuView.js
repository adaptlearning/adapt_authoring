// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('core/origin');
    var GlobalMenuItemView = require('./globalMenuItemView');

    var GlobalMenuView = Backbone.View.extend({

        className: 'global-menu',

        initialize: function() {
            this.listenTo(Origin, 'globalMenu:globalMenuView:remove', this.removeMenu);
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

            this.collection.each(function(menuItem) {

                var location = menuItem.get('location');
                var _isSubItem = menuItem.get('_isSubMenuItem');
                // Check location and only render if location is either global or current location
                if (location === 'global' || location === Origin.location.module) {
                    // Only load view if it's not a subItem
                    if (_isSubItem === false) {
                        this.$('.global-menu-inner').append(new GlobalMenuItemView({
                            collection: this.collection,
                            model: menuItem
                        }).$el);
                    }
                }

            }, this);

            // Wait until menu items are rendered before showing
            _.defer(_.bind(function() {
                this.$el.fadeIn(300);
            }, this));

        },

        removeMenu: function() {
            this.$el.fadeOut(300, _.bind(function() {
                this.remove();
            }, this));
        }

    }, {
        template: 'globalMenu'
    });

    return GlobalMenuView;

})
