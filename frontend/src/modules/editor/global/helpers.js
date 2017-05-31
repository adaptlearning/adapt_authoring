define(function(require) {
  var Origin = require('core/origin');

  var helpers = {
    /**
    * set the page title based on location
    * accepts backbone model, or object like so { title: '' }
    */
    setPageTitle: function(model, shouldAddEditingPrefix) {
      var type = Origin.location.route2 || Origin.location.route1;
      var action = Origin.location.route4;
      var titleKey;
      switch(type) {
        case 'page':
          if(action === 'edit') {
            titleKey = 'editor' + type + 'settings';
            break;
          }
        default:
          titleKey = 'editor' + type;
      }
      var langString = Origin.l10n.t('app.' + titleKey);
      var modelTitle = model && model.get && model.get('title') || model.title;

      var title = modelTitle || langString;
      if(shouldAddEditingPrefix === true) title = addEditingPrefix(title, type);

      Origin.trigger('location:title:update', { title: title });
    }
  }

  /**
  * Private functons
  */

  function addEditingPrefix(string, type) {
    return Origin.l10n.t('app.editing', {
      text: string,
      type: Origin.l10n.t('app.' + type)
    });
  }

  return helpers;
});
