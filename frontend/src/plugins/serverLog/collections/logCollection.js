// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');

  var LogCollection = Backbone.Collection.extend({
    url: '/log',
    comparator: function(a, b) {
      var aDate = new Date(a.get('timestamp'));
      var bDate = new Date(b.get('timestamp'));
      if(aDate < bDate) return 1;
      else if(aDate > bDate) return -1;
      else return 0;
    }
  });

  return LogCollection;
});
