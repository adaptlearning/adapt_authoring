require.config({
  baseUrl: '/js',
  paths: {
    jquery: 'lib/jquery',
    backbone: 'lib/backbone',
    underscore: 'lib/underscore',
    handlebars: 'lib/handlebars',
    templates: 'templates',
    text: 'lib/text'
  },
  shim: {
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    underscore: {
      exports: '_'
    },
    handlebars: {
      exports: 'Handlebars'
    },
    text: {
      exports: 'text'
    }
  }
});

require(["init"]);
