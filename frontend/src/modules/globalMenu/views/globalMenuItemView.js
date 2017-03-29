// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('core/origin');

    var GlobalMenuItemView = Backbone.View.extend({

        className: 'global-menu-item',

        events: {
            'click a.global-menu-item-inner': 'onMenuItemClicked'
        },

        initialize: function() {
            // Used to clean up view when closing the menu
            this.listenTo(Origin, 'globalMenu:globalMenuView:remove', this.remove);
            this.render();
            _.defer(_.bind(function() {
                // Setup children items and hover events if the menu item is not a subMenuItem
                if (!this.model.get('_isSubMenuItem')) {
                    // Only setup hover events if menu item has children
                    if (this.setupChildren()) {
                        this.setupHover();
                    };
                } else {
                    this.listenTo(Origin, 'globalMenu:globalSubMenuView:remove', this.remove);
                }
            }, this));
        },

        render: function() {
            var data = this.model.toJSON();
            var template = Handlebars.templates[this.constructor.template];
            this.$el.html(template(data));
            return this;
        },

        setupChildren: function() {
            // Find children subItems
            this.children = this.collection.where({parent: this.model.get('text')});

            // If this item has subItems return true else return false
            // This helps decide whether hover events get added or not
            if (this.children.length >= 1) {
                return true;
            } else {
                return false;
            }

        },

        setupHover: function() {
            // On hover show subItems
            this.$('.global-menu-item-inner').hover(_.bind(function() {
                if (!this.model.get('_isActive')) {
                    this.model.set('_isActive', true);
                } else {
                    return;
                }
                _.each(this.children, function(subMenuItem) {

                    $('.global-menu-submenu-inner').append(new GlobalMenuItemView({
                        model:subMenuItem,
                        collection: this.collection
                    }).$el)
                    $('.global-menu-submenu').stop().fadeIn(300);

                }, this);

            }, this), _.bind(function() {

                // Check if subMenuItems are not being hovered before removing
                if ($('.global-menu-submenu').is(":hover")) {
                    return;
                }

                // Trigger event to remove subMenuViews
                Origin.trigger('globalMenu:globalSubMenuView:remove');
                $('.global-menu-submenu').hide();
                // Set _isActive to false to enable the menu to reset
                this.model.set('_isActive', false);

            }, this));
        },

        onMenuItemClicked: function(event) {
            event.preventDefault();
            // Set all active menu items to false
            this.collection.invoke('set', {"_isActive": false});
            // Trigger callback event
            Origin.trigger('globalMenu:' + this.model.get('callbackEvent'));
            // Trigger navigation toggle to close
            Origin.trigger('globalMenu:close');
        }

    }, {
        template: 'globalMenuItem'
    });

    return GlobalMenuItemView;

})