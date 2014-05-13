/*
* Context Menu
* License - https://github.com/adaptlearning/adapt_framework/blob/master/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require) {

  var ContextMenuView = require('coreJS/app/views/contextMenuView');
  var ContextMenuCollection = new Backbone.Collection();
  var Origin = require('coreJS/app/origin');

  var ContextMenu = {};

  ContextMenu.addItem = function(type, contextMenuObject) {
    if (contextMenuObject.length > 1) {
      _.each(contextMenuObject, function (object) {
        object.type = type;
        ContextMenuCollection.add(object);
      });
    } else {
      contextMenuObject.type = type;
      ContextMenuCollection.add(contextMenuObject);
    }
  }

  var init = function() {
    new ContextMenuView({collection: ContextMenuCollection});
    // Setup context menu items
    var contextItems = [
      {
        title: 'Edit',
        className: 'context-menu-item',
        callbackEvent: "edit"
      },
      {
        title: 'Copy',
        className: 'context-menu-item',
        callbackEvent: "copy"
      },
      {
        title: 'Delete',
        className: 'context-menu-item',
        callbackEvent: "delete"
      }
    ];
    ContextMenu.addItem('article', contextItems);
    ContextMenu.addItem('block', contextItems);
    ContextMenu.addItem('component', contextItems);
  }

  Origin.once('app:initContextMenu', function() {
    init();
  });

  Origin.contextMenu = ContextMenu;

});
