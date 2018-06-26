define([
    'core/origin',
    './models/colors',
    './views/colorLabelPopupView'
], function(Origin, ColorsModel, ColorLabelPopupView) {
    
    'use strict';
    
    var parentView;
    var eventName;

    Origin.on('contextMenu:open', function(view, event) {
        var type = view.model.get('_type');

        if (parentView) {
            removeEvent();
        }

        parentView = view;
        eventName = 'contextMenu:'+type+':colorLabel';
        
        setupEvent();
    });

    Origin.on('contextMenu:closed', function() {
        removeEvent();
    });

    function setupEvent() {
        parentView.on(eventName, showPopup);
    }

    function removeEvent() {
        if (!parentView) return;

        parentView.off(eventName, showPopup);
        parentView = null;
        eventName = '';
    }

    function showPopup() {
        (new ColorLabelPopupView({
            model: new ColorsModel(),
            parentView: parentView
        })).$el.appendTo(document.body);
    }

});