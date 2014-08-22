define(function(require) {

    var Origin = require('coreJS/app/origin');
    var OriginView = require('coreJS/app/views/originView');

    var SidebarFilterView = OriginView.extend({

        className: 'sidebar-filter',

        events: {
            'click .sidebar-filter-toolbar-close': 'onCloseButtonClicked'
        },

        initialize: function() {
            this.listenTo(Origin, 'sidebar:sidebarFilter:remove', this.remove);
            this.render();
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