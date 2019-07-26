// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');

  var FrameworkImportPluginView = OriginView.extend({
    tagName: 'div',
    initialize: function(options) {
      this.options = options;
      this.render();
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.options.data));
    }
  }, {
    template: 'frameworkImportPluginView'
  });

  return FrameworkImportPluginView;
});
