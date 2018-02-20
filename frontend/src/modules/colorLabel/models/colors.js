define([
    'core/origin'
], function(Origin) {
    
    'use strict';

    var DefaultColors = Backbone.Model.extend({

        defaults: {
            // colors from https://material.io/guidelines/style/color.html#color-color-palette
            colors: [
                // Grey
                { background: "#F5F5F5", border: "#9E9E9E" },
                { background: "#E0E0E0", border: "#757575" },
                // red
                { background: "#FFEBEE", border: "#F44336" },
                { background: "#EF9A9A", border: "#E53935" },
                // purple
                { background: "#E1BEE7", border: "#9C27B0" },
                { background: "#CE93D8", border: "#8E24AA" },
                // blue
                { background: "#E3F2FD", border: "#42A5F5" },
                { background: "#90CAF9", border: "#1976D2" },
                // green 
                { background: "#E8F5E9", border: "#4CAF50" },
                { background: "#C8E6C9", border: "#43A047" },
                // orange
                { background: "#FFE0B2", border: "#FF9800" },
                { background: "#FFCC80", border: "#FB8C00" },
                
                // Deep Orange
                { background: "#FFCCBC", border: "#FF5722" },
                { background: "#FFAB91", border: "#F4511E" },
                // Brown
                { background: "#D7CCC8", border: "#795548" },
                { background: "#BCAAA4", border: "#6D4C41" }
            ]
        },

        findByColor: function(background) {
            var colors = this.get('colors');
            for (var i = 0; i < colors.length; i++) {
                if (colors[i].background === background) {
                    return i;
                }
            }
            return -1;
        }

    });

    return DefaultColors;

});