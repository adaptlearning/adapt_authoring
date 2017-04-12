define(function(require) {
  var Origin = require('core/origin');

  var Helpers = {
    /**
    * Sets the page title and breadcrumbs based on location
    * accepts backbone model, or object like so { title: '' }
    */
    setPageTitle: function(model, shouldAddEditingPrefix) {
      var type = Origin.location.route2;
      var action = Origin.location.route4;

      var titleKey = 'editor' + type + (action || '');
      var langString = Origin.l10n.t('app.' + titleKey);

      var courseTitle = Origin.editor.data.course.get('title');
      var modelTitle = model && model.get && model.get('title') || model.title;

      var crumbs = ['dashboard'];

      if(type !== 'menu') {
        crumbs.push('course');
      }
      if(action === 'edit') {
        var page = getNearestPage(model);
        crumbs.push({
          title: Origin.l10n.t('app.editorpage'),
          url: '#/editor/' + page.get('_courseId') + '/page/' + page.get('_id')
        });
      }
      crumbs.push({ title: langString });

      var title = modelTitle || langString;
      if(shouldAddEditingPrefix === true) title = addEditingPrefix(title);

      Origin.trigger('location:title:update', {
        breadcrumbs: crumbs,
        title: title
      });
    }
  }

  /**
  * Private functons
  */

  function getNearestPage(model) {
    var map = {
      'component': 'components',
      'block': 'blocks',
      'article': 'articles',
      'page': 'contentObjects'
    };
    var mapKeys = Object.keys(map);
    while(model.get('_type') !== 'page') {
      var parentType = mapKeys[_.indexOf(mapKeys, model.get('_type')) + 1];
      var parentCollection = Origin.editor.data[map[parentType]];
      model = parentCollection.findWhere({ _id: model.get('_parentId') });
    }
    return model;
  }

  function addEditingPrefix(string) {
    return Origin.l10n.t('app.editing', { text: string });
  }

  return Helpers;
});
