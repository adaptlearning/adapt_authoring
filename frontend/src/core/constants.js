// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(['require', 'core/origin'], function(require, Origin, configJson) {
  // Read in the configuration values/constants
  $.getJSON('config/config.json', function(configData) {
    Origin.constants = configData;
    Origin.trigger('constants:loaded');
  });
});
