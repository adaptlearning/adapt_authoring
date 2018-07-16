// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ModalView = require('./views/modalView');

  Origin.on('modal:open', function(view, options, context) {
    new ModalView({
      view: view,
      options: options,
      context: context
    });
  });
});
