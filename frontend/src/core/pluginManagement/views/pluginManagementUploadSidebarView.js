// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var SidebarItemView = require('coreJS/sidebar/views/sidebarItemView');

    var PluginManagementUploadSidebarView = SidebarItemView.extend({

        events: {
            'click .pluginManagement-upload-sidebar-save-button': 'onSaveButtonClicked',
            'click .pluginManagement-upload-sidebar-cancel-button': 'onCancelButtonClicked'
        },

        onSaveButtonClicked: function() {
            this.updateButton('.pluginManagement-upload-sidebar-save-button', window.polyglot.t('app.saving'));
            Origin.trigger('pluginManagement:uploadPlugin');
        },

        onCancelButtonClicked: function() {
            Origin.router.navigate('#/pluginManagement', {trigger: true});
        }

    }, {
        template: 'pluginManagementUploadSidebar'
    });

    return PluginManagementUploadSidebarView;

});
