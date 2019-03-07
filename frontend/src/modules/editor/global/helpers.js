define(function(require) {
  var Origin = require('core/origin');

  var ContentObjectModel = require('core/models/contentObjectModel');
  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ComponentModel = require('core/models/componentModel');

  var Helpers = {
    /**
    * set the page title based on location
    * expects backbone model
    */
    setPageTitle: function(model) {
      getNearestPage(model, function(page) {
        var data = {
          model: model || {},
          page: page,
          langString: Origin.l10n.t('app.' + getLangKey())
        };
        Origin.trigger('location:title:update', {
          breadcrumbs: generateBreadcrumbs(data),
          title: getTitleForModel(data)
        });
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
    var isMenu = type === 'menu';
    var isEditor = action === 'edit';
    var crumbs = ['dashboard'];

    if (!isMenu || isEditor) {
      crumbs.push('course');
    }
    if (!isMenu && isEditor) {
      crumbs.push({
        title: Origin.l10n.t('app.editorpage'),
        url: '#/editor/' + data.page.get('_courseId') + '/page/' + data.page.get('_id')
      });
    }
    crumbs.push({ title: data.langString });
    return crumbs;
  }

  function getTitleForModel(data) {
    var modelTitle = data.model.title || data.model.get && data.model.get('title');
    return modelTitle || Origin.editor.data.course.get('title');
  }

  function getLangKey() {
    var type = getType();
    var action = getAction();

    if ((type === 'page' || type === 'menu') && action === 'edit') {
      return 'editorpagesettings';
    }
    return 'editor' + type;
  }

  function getNearestPage(model, cb) {
    if(!model.get('_type') || model.get('_type') === 'course') {
      return cb();
    }
    var map = {
      component: ComponentModel,
      block: BlockModel,
      article: ArticleModel,
      page: ContentObjectModel
    };
    var mapKeys = Object.keys(map);
    var _recurse = function(model) {
      var type = model.get('_type');
      if (type === 'page' || type === 'menu') {
        return cb(model);
      }
      var parentType = mapKeys[mapKeys.indexOf(type) + 1];
      (new map[parentType]({ _id: model.get('_parentId') })).fetch({ success: _recurse });
    }
    // start recursion
    _recurse(model);
  }

  return Helpers;
});
