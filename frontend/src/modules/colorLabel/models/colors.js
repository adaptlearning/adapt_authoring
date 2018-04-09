define([
    'core/origin'
], function(Origin) {
    
    'use strict';

    var DefaultColors = Backbone.Model.extend({
        defaults: {
            // colors from https://material.io/guidelines/style/color.html#color-color-palette
            colors: [
                "colorlabel-1",
                "colorlabel-2",
                "colorlabel-3",
                "colorlabel-4",
                "colorlabel-5",
                "colorlabel-6",
                "colorlabel-7",
                "colorlabel-8",
                "colorlabel-9",
                "colorlabel-10",
                "colorlabel-11",
                "colorlabel-12",
                "colorlabel-13",
                "colorlabel-14"
            ]
        }
    });

    return DefaultColors;

});