// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('coreJS/app/origin');
  var ModalView = require('coreJS/modal/views/modalView');
  var ModalModel = require('coreJS/modal/models/modalModel');

  Origin.on('modal:open', function(view, options, context) {
    new ModalView({
      view: view,
      options: options,
      context: context
    });
  });

});