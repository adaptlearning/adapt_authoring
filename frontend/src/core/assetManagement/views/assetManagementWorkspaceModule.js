// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var AssetManagementRefineModule = require('coreJS/assetManagement/views/assetManagementRefineModule');
  var Origin = require('coreJS/app/origin');

  var AssetManagementWorkspaceModule = AssetManagementRefineModule.extend({
    className: 'module workspace',
    filterType: 'search',

    events: {
      'click input': 'onInputClicked'
    },

    initialize: function(options) {
      // used by the template
      options.workspaces = {
        page: Origin.location.route3 !== null
      };
      AssetManagementRefineModule.prototype.initialize.apply(this, arguments);
    },

    resetFilter: function() {
      this.$('input[id=all]').click();
    },

    onInputClicked: function(e) {
      var type = e.currentTarget.id;
      var id;
      var emptyFilter = {
        'workspaces.component':{},
        'workspaces.block':{},
        'workspaces.article':{},
        'workspaces.page':{},
        'workspaces.menu':{},
        'workspaces.course':{}
      };

      if(type === 'all') {
        return this.applyFilter(emptyFilter);
      }
      else if(type === 'course') {
        id = Origin.editor.data.course.get('_id');
      }
      else {
        var contentTypes = [ 'component', 'block', 'article', 'page', 'menu' ];
        var id = Origin.location.route3;
        // note we start at the right point in the hierarchy
        // route2 === content type
        for(var i = _.indexOf(contentTypes, Origin.location.route2), count = contentTypes.length; i < count; i++) {
          if(i < 0) break;
          if(contentTypes[i] === type) break;
          var match = this.getCollectionforContentType(contentTypes[i]).findWhere({ _id:id });
          id = match.get('_parentId') || false;
        }
      }
      var search = emptyFilter;
      search['workspaces.' + type] = id;
      this.applyFilter(search);
    },

    // TODO duplicate assetManagementNewAsset
    getCollectionforContentType: function(type) {
      switch(type) {
        case 'menu':
        case 'page':
          return Origin.editor.data.contentObjects;
        case 'article':
          return Origin.editor.data.articles;
        case 'block':
          return Origin.editor.data.blocks;
        case 'component':
          return Origin.editor.data.components;
        default:
          return undefined;
      }
    }
  }, {
    template: 'assetManagementWorkspaceModule'
  });

  return AssetManagementWorkspaceModule;
});
