define(function(require) {
  var Origin = require('core/origin');

  var Helpers = {
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
      var crumbs = ['dashboard'];
      if(type !== 'menu') crumbs.push('course');
      if(action === 'edit') {
        var page = Helpers.getNearestPage(model);
        crumbs.push({
          title: Origin.l10n.t('app.editorpage'),
          url: '#/editor/' + page.get('_courseId') + '/page/' + page.get('_id')
        });
      }
      crumbs.push({ title: langString });

      Origin.trigger('location:title:update', {
        breadcrumbs: crumbs,
        title: modelTitle || langString
      });
    },

      Origin.trigger('location:title:update', { title: title });
    }
  }

<<<<<<< HEAD
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
=======
  return Helpers;
>>>>>>> Add support for breadcrumbs in helper function
});
