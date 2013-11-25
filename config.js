require.config({
    paths: {
      jquery: 'core/js/libraries/jquery',
      underscore: 'core/js/libraries/underscore',
      backbone: 'core/js/libraries/backbone',
      modernizr: 'core/js/libraries/modernizr',
      handlebars: 'core/js/libraries/handlebars',
      coreJS: 'core/js',
      coreViews: 'core/js/views',
      coreModels: 'core/js/models',
      templates: 'templates/templates'
    },
    shim: {
      jquery: [

      ],
      backbone: {
          deps: [
            'underscore',
            'jquery'
          ],
          exports: 'Backbone'
      },
      underscore: {
          exports: '_'
      },
      handlebars: {
        exports: 'Handlebars'
      }
    }
});