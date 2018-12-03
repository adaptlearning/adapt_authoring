// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var EditorData = require('./editorDataLoader');

  /**
  * Mini event-hub for editor events.
  * Sends out more developer-friendly versions of router:editor events.
  * Also note that these events are only triggered once the editor data's ready
  */
  Origin.on('router:editor', function() {
    EditorData.waitForLoad(function() {
      var route2 = Origin.location.route2;
      var type;
      switch(route2) {
        case 'article':
        case 'block':
        case 'component':
        case 'config':
        case 'extensions':
        case 'menusettings':
        case 'selecttheme':
          type = route2;
          break;
        case 'page':
        case 'menu':
          type = 'contentObject';
          break;
        case 'settings':
          type = 'course';
          break;
        default: // unknown type
          return;
      }
      console.log('editor:' + type);
      Origin.trigger('editor:' + type, {
        type: route2,
        id: Origin.location.route3,
        action: Origin.location.route4
      });
    });
  });
});
