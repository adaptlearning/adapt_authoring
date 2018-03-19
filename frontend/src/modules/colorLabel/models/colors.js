define([
    'core/origin'
], function(Origin) {
    
    'use strict';

    var DefaultColors = Backbone.Model.extend({
        defaults: {
            // colors from https://material.io/guidelines/style/color.html#color-color-palette
            colors: [
                "grey-700",
                "grey-400",
                "red-700",
                "red-200",
                "purple-700",
                "purple-200",
                "blue-700",
                "blue-200",
                "green-700",
                "green-200",
                "orange-700",
                "orange-200",
                "brown-700",
                "brown-200"
            ]
        }
    });

    return DefaultColors;

});