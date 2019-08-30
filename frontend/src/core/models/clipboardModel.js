// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContentModel = require('./contentModel');

  var ClipboardModel = ContentModel.extend({
    urlRoot: 'api/content/clipboard',
  });

  return ClipboardModel;
});
