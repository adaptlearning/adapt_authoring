define(function(require) {

    var Origin = require('coreJS/app/origin');
    var OriginView = require('coreJS/app/views/originView');

    var SidebarFilterView = OriginView.extend({

        className: 'sidebar-filter',

        events: {
            'click .sidebar-filter-toolbar-close': 'onCloseButtonClicked'
        },

        initialize: function(options) {
            this.data = {};
            this.data.title = options.title;
            this.data.items = options.items;
            this.listenTo(Origin, 'remove:views', this.remove);
            this.listenTo(Origin, 'sidebar:sidebarFilter:remove', this.remove);
            this.render();
        },

        render: function() {
            var template = Handlebars.templates[this.constructor.template];
            this.$el.html(template(this.data));
            _.defer(_.bind(function() {
                this.postRender();
            }, this));
            return this;
        },

        postRender: function() {
            console.log('wheeeeee');
            this.$('.sidebar-filter-search-input').focus();
        },

        onCloseButtonClicked: function() {
            this.remove();
        }

    }, {
        template: 'sidebarFilter'
    });

    return SidebarFilterView;

})