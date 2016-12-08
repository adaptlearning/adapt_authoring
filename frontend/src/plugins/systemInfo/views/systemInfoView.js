// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var _ = require('underscore');
  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var SystemInfoView = OriginView.extend({
    tagName: 'div',
    className: 'systemInfo',

    postRender: function() {
      this.setViewToReady();
    }
  }, {
    template: 'systemInfo'
  });

  return SystemInfoView;
});
