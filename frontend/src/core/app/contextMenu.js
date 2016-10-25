// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var ContextMenuView = require('coreJS/app/views/contextMenuView');
  var Origin = require('coreJS/app/origin');

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

  // Privates

  Origin.on('app:dataReady login:changed', init);

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
        title: window.polyglot.t('app.duplicate'),
        className: 'context-menu-item',
        callbackEvent: 'duplicate'
      },
      {
        title: window.polyglot.t('app.preview'),
        className: 'context-menu-item',
        callbackEvent: 'preview'
      }
    ]);
    var courseItems = getDefaultItems(['copyID']);
    var superPerms = ["*/*:create","*/*:read","*/*:update","*/*:delete"];
    if (Origin.permissions.hasPermissions(superPerms)) {
      courseItems.push({
        title: window.polyglot.t('app.export'),
        className: 'context-menu-item',
        callbackEvent: 'export'
      });
    }
    ContextMenu.addItem('course', courseItems);
  };

  /*
  * returns the default list excluding anything in [blacklist] (uses event name)
  */
  function getDefaultItems(blacklist) {
    var DEFAULT_ITEMS = [
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
        title: window.polyglot.t('app.copyidtoclipboard'),
        className: 'context-menu-item',
        callbackEvent: "copyID"
      },
      {
        title: window.polyglot.t('app.delete'),
        className: 'context-menu-item',
        callbackEvent: "delete"
      }
    ];
    if(!blacklist) {
      return DEFAULT_ITEMS;
    } else {
      return _.filter(DEFAULT_ITEMS, function(item) {
        return blacklist.indexOf(item.callbackEvent) < 0;
      });
    }
  };
});
