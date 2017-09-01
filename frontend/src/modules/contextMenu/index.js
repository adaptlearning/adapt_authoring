// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var ContextMenuView = require('./views/contextMenuView');

  // Public API
  Origin.contextMenu = ContextMenu = {
    addItem: function(type, contextMenuObject) {
      if (contextMenuObject.length > 1) {
        _.each(contextMenuObject, function (object) {
          object.type = type;
          menuItems.add(object);
        });
      } else {
        contextMenuObject.type = type;
        menuItems.add(contextMenuObject);
      }
    }
  };

  Origin.on('origin:dataReady login:changed', init);

  // Privates

  var menuItems;
  var view;

  function init() {
    menuItems = new Backbone.Collection();
    setUpMenuItems();

    if(view) view.remove();
    view = new ContextMenuView({ collection: menuItems });
  };

  function setUpMenuItems() {
    ContextMenu.addItem('article', getDefaultItems());
    ContextMenu.addItem('block', getDefaultItems());
    ContextMenu.addItem('component', getDefaultItems());
    ContextMenu.addItem('page', getDefaultItems());
    ContextMenu.addItem('menu', getDefaultItems(['copy']));
    ContextMenu.addItem('page-min', getDefaultItems(['copy','delete']));
    ContextMenu.addItem('sharedcourse', [
      {
        title: Origin.l10n.t('app.duplicate'),
        className: 'context-menu-item',
        callbackEvent: 'duplicate'
      },
      {
        title: Origin.l10n.t('app.preview'),
        className: 'context-menu-item',
        callbackEvent: 'preview'
      }
    ]);
    ContextMenu.addItem('course', getDefaultItems());
  };

  /*
  * returns the default list excluding anything in [blacklist] (uses event name)
  */
  function getDefaultItems(blacklist) {
    var DEFAULT_ITEMS = [
      {
        title: Origin.l10n.t('app.edit'),
        className: 'context-menu-item',
        callbackEvent: "edit"
      },
      {
        title: Origin.l10n.t('app.copy'),
        className: 'context-menu-item',
        callbackEvent: "copy"
      },
      {
        title: Origin.l10n.t('app.copyidtoclipboard'),
        className: 'context-menu-item',
        callbackEvent: "copyID"
      },
      {
        title: Origin.l10n.t('app.delete'),
        className: 'context-menu-item',
        callbackEvent: "delete"
      }
    ];
    if(!blacklist) {
      return DEFAULT_ITEMS;
    }
    return _.filter(DEFAULT_ITEMS, function(item) {
      return blacklist.indexOf(item.callbackEvent) < 0;
    });
  };
});
