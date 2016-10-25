// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var CourseImportSidebar = SidebarItemView.extend({

        events: {
            'click button.import': 'onImportClicked',
            'click button.cancel': 'onCancelClicked'
        },

        onImportClicked: function() {
            Origin.trigger('courseImport:import');
        },

        onCancelClicked: function() {
            Origin.router.navigate('#', { trigger: true });
        }
    }, {
        template: 'courseImportSidebar'
    });

    return CourseImportSidebar;
});
