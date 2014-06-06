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
        title: window.polyglot.t('app.edit'),
        className: 'context-menu-item',
        callbackEvent: "edit"
      },
      {
        title: window.polyglot.t('app.copy'),
        className: 'context-menu-item',
        callbackEvent: "copy"
      },
      {
        title: window.polyglot.t('app.cut'),
        className: 'context-menu-item',
        callbackEvent: "cut"
      },
      {
        title: window.polyglot.t('app.delete'),
        className: 'context-menu-item',
        callbackEvent: "delete"
      }
    ];

    ContextMenu.addItem('article', contextItems);
    ContextMenu.addItem('block', contextItems);
    ContextMenu.addItem('component', contextItems);
    ContextMenu.addItem('menu', contextItems);
    ContextMenu.addItem('page', contextItems);
  }

  Origin.once('app:dataReady', function() {
    init();
  });

  Origin.contextMenu = ContextMenu;

});
