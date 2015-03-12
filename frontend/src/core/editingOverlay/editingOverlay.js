// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Origin = require('coreJS/app/origin');
    var EditingOverlayView = require('coreJS/editingOverlay/views/editingOverlayView');

    Origin.editingOverlay = {};

    Origin.editingOverlay.addView = function(element) {
        // Trigger to remove current views
        Origin.trigger('editingOverlay:views:remove');

        // Check if element is a view element
        if (_.isElement(element[0]) !== true) {
            return console.log("Editing Overlay - Cannot add this object to the editing overlay view. Please make sure it's the views $el");
        }

        Origin.trigger('editingOverlay:views:show', element);

    }

    Origin.on('app:dataReady', function() {
        $('.app-inner').append(new EditingOverlayView().$el);
    });

});