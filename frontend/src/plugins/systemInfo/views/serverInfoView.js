// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var InfoView = require('./infoView.js');

  var ServerInfoView = InfoView.extend({
    className: 'serverInfo',
    route: 'server',

    preRender: function() {
      var self = this;
      this.getData('installed', function(data) {
        self.model.set('installed', data);
        self.render();
      });
    }
  }, {
    template: 'serverInfo'
  });

  return ServerInfoView;
});
