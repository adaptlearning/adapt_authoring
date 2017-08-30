// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'jquery', 'polyglot', 'core/origin'], function(require, $, Polyglot, Origin) {
  var polyglot;
  // set up global l10n object
  Origin.l10n = {
    t: function(string, data) {
      if(!polyglot || !polyglot.t) {
        return string;
      }
      return polyglot.t.apply(polyglot, arguments);
    }
  };
  /**
  * Initialise from language file
  */

  //Rudimentary language detection https://stackoverflow.com/questions/673905/best-way-to-determine-users-locale-within-browser
  var locale;
  if (typeof navigator !== 'undefined'){
    if(typeof navigator.languages !== 'undefined'){
      locale = navigator.languages[0];
    } else if(typeof navigator.language !== 'undefined'){
      locale = navigator.language;
    } else if(typeof navigator.browserLanguage !== 'undefined'){
      locale = navigator.browserLanguage;
    } else if(typeof navigator.systemLanguage !== 'undefined'){
      locale = navigator.systemLanguage;
    } else if(typeof navigator.userLanguage !== 'undefined'){
      locale = navigator.userLanguage;
    } else {
      locale = localStorage.getItem('lang') || 'en';
    }
  }
  else {
    locale = localStorage.getItem('lang') || 'en';
  }

  //remove any country code
  locale = locale.split("-")[0];

  $.getJSON('lang/' + locale, function(data) {
    polyglot = new Polyglot({ phrases: data });
    Origin.trigger('l10n:loaded');
  });
});
