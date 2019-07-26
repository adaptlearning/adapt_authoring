// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');

  var FrameworkImportPluginHeadingView = OriginView.extend({
    tagName: 'div'
  }, {
    template: 'frameworkImportPluginHeadingView'
  });

  return FrameworkImportPluginHeadingView;
});
