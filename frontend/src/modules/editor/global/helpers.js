define(function(require) {
  var Origin = require('core/origin');

  var Helpers = {
    /**
    * set the page title based on location
    * accepts backbone model, or object like so { title: '' }
    */
    setPageTitle: function(model) {
      var data = {
        model: model || {},
        langString: Origin.l10n.t('app.' + getLangKey())
      };
      Origin.trigger('location:title:update', {
        breadcrumbs: generateBreadcrumbs(data),
        title: getTitleForModel(data)
      });
    }
  }

  /**
  * Private functons
  */

  function getType() {
    return Origin.location.route2 || Origin.location.route1;
  }

  function getAction() {
    return Origin.location.route4;
  }

  function generateBreadcrumbs(data) {
    var type = getType();
    var action = getAction();
    var crumbs = ['dashboard'];

    if(type !== 'menu') {
      crumbs.push('course');
    }
    if(action === 'edit') {
      var page = getNearestPage(data.model);
      crumbs.push({
        title: Origin.l10n.t('app.editorpage'),
        url: '#/editor/' + page.get('_courseId') + '/page/' + page.get('_id')
      });
    }
    crumbs.push({ title: data.langString });
    return crumbs;
  }

  function getTitleForModel(data) {
    var type = getType();
    var modelTitle = data.model.title || data.model.get && data.model.get('title');
    return modelTitle || data.langString;
  }

  function getLangKey() {
    var type = getType();
    var action = getAction();
    switch(type) {
      case 'page':
        if(action === 'edit') return 'editor'+type+'settings';
      default:
        return 'editor'+type;
    }
  }

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

  return Helpers;
});
