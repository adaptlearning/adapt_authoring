// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'jquery', 'polyglot', 'core/origin'], function(require, $, Polyglot, Origin) {
  var locale = localStorage.getItem('lang') || 'en';
  // Get the language file
  $.getJSON('lang/' + locale, function(data) {
    // Instantiate Polyglot with phrases
    window.polyglot = new Polyglot({ phrases: data });
    Origin.trigger('l10n:loaded');
  });
});
