// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
require.config({
  paths: {
    ace: 'libraries/ace',
    backbone: 'libraries/backbone',
    backboneForms:'libraries/backbone-forms',
    backboneFormsLists:'libraries/backbone-forms-lists',
    colorPicker: 'libraries/colorPicker/js/colorpicker',
    handlebars: 'libraries/handlebars',
    imageReady: 'libraries/imageReady',
    inview: 'libraries/inview',
    jquery: 'libraries/jquery',
    jqueryForm : 'libraries/jquery.form',
    jqueryUI: 'libraries/jquery-ui.min',
    jsoneditor: 'libraries/jquery.jsoneditor.min',
    mediaelement : 'libraries/mediaelement-and-player',
    modernizr: 'libraries/modernizr',
    moment: 'libraries/moment.min',
    pikaday: 'libraries/pikaday/js/pikaday',
    polyglot: 'libraries/polyglot.min',
    scrollTo: 'libraries/scrollTo',
    sweetalert: 'libraries/sweetalert.min',
    typeahead: 'libraries/typeahead',
    underscore: 'libraries/underscore',
    velocity: 'libraries/velocity'
  },
  shim: {
    // third-party
    ace: {
      exports: 'ace/ace'
    },
    backbone: {
      deps: ['underscore','jquery'],
      exports: 'Backbone'
    },
    backboneForms: {
      deps: ['backbone']
    },
    backboneFormsLists: {
      deps: ['backboneForms']
    },
    colorPicker: {
      deps: ['jquery'],
    },
    handlebars: {
      exports: 'Handlebars'
    },
    imageReady: {
      deps: ['jquery'],
      exports: 'imageready'
    },
    inview: {
      deps: ['jquery'],
      exports: 'inview'
    },
    'jquery-form': {
      deps: ['jquery'],
      exports: "$"
    },
    'jquery-ui': {
      deps: ['jquery'],
      exports: "$"
    },
    jsoneditor: {
      deps: ['jquery'],
      exports: 'JsonEditor'
    },
    mediaelement: {
      deps: ['jquery'],
      exports: 'mediaelement'
    },
    moment: {
      exports: 'moment'
    },
    polyglot: {
      exports: 'Polyglot'
    },
    scrollTo: {
      deps: ['jquery'],
      exports: 'scrollTo'
    },
    sweetalert: {
      deps: ['jquery'],
      exports: 'sweetAlert'
    },
    tags: {
      deps: ['jquery'],
      exports: "$"
    },
    underscore: {
      exports: '_'
    },
    velocity: {
      deps: ['jquery'],
      exports: 'velocity'
    },
    // internal
    'templates/templates': {
      deps:['handlebars']
    }
  }
});
