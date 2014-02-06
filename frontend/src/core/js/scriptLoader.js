Modernizr.load([
    {
        test: window.JSON,
        nope: 'frontend/src/core/js/libraries/json2.js'
    },
    {
        test: Modernizr.video || Modernizr.audio,
        nope: 'frontend/src/core/js/libraries/swfObject.js',
        complete: function() {
            yepnope.injectJs("libraries/require.js", function () {   
            }, {
                type:"text/javascript",
                language:"javascript",
                "data-main":"adaptbuilder/js/adaptbuilder.min.js"
            }, 5000);
        }
    }
]);