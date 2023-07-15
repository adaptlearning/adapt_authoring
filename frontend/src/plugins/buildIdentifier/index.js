define(function(require) {
    var Origin = require('core/origin');
    var Backbone = require('backbone');
    var Helpers = require('core/helpers');
  
    var fetch = Backbone.Collection.prototype.fetch;
    Backbone.Collection.prototype.fetch = function() {
        return fetch.apply(this, arguments).success(function(res){
            var build = Helpers.getCookie('buildNumber');
            if(!window.buildNumber){
                window.buildNumber = build;
            }
            if(window.buildNumber !== build){
                Origin.Notify.alert({
                    type: 'info',
                    text: Origin.l10n.t('app.updateavailable')
                });
            }
        })
      };
  });