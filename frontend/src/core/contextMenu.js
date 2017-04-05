// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
* Context Menu
* License - https://github.com/adaptlearning/adapt_framework/blob/master/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require) {

  var ContextMenuView = require('core/views/contextMenuView');
  var ContextMenuCollection = new Backbone.Collection();
  var Origin = require('core/origin');

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

    ContextMenu.addItem('article', contextItems);
    ContextMenu.addItem('block', contextItems);
    ContextMenu.addItem('component', contextItems);
    ContextMenu.addItem('page', contextItems);

    ContextMenu.addItem('page-min', [
      {
        title: Origin.l10n.t('app.edit'),
        className: 'context-menu-item',
        callbackEvent: "edit"
      },
      {
        title: Origin.l10n.t('app.copyidtoclipboard'),
        className: 'context-menu-item',
        callbackEvent: "copyID"
      }
    ]);

    // Set the section/menu menu options
    contextItems.splice(_.indexOf(contextItems, _.findWhere(contextItems, { callbackEvent : "copy"})), 1);
    ContextMenu.addItem('menu', contextItems);

    var courseContextItems = [
      {
        title: Origin.l10n.t('app.editsettings'),
        className: 'context-menu-item',
        callbackEvent: 'editSettings'
      },
      {
        title: Origin.l10n.t('app.editcourse'),
        className: 'context-menu-item',
        callbackEvent: 'edit'
      },
      {
        title: Origin.l10n.t('app.copy'),
        className: 'context-menu-item',
        callbackEvent: 'duplicate'
      },
      {
        title: Origin.l10n.t('app.delete'),
        className: 'context-menu-item',
        callbackEvent: 'delete'
      }
    ];

    ContextMenu.addItem('course', courseContextItems);

    var sharedCourseContextItems = [
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
    ];

    ContextMenu.addItem('sharedcourse', sharedCourseContextItems);
  }

  Origin.once('origin:dataReady', function() {
    init();
  });

  Origin.contextMenu = ContextMenu;

});
