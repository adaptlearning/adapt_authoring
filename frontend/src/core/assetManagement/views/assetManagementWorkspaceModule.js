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

    resetFilter: function() {
      this.$('input[id=all]').click();
    },

    onInputClicked: function(e) {
      // TODO this code is very similar to assetManagementNewAssetView...
      var type = e.currentTarget.id;
      var id;

      if(type === 'all') {
        this.applyFilter({
          'workspaces.course':{},
          'workspaces.page':{},
          'workspaces.article':{},
          'workspaces.block':{},
          'workspaces.component':{}
        });
      }
      else if(type === course) {
        id = Origin.editor.data.course.get('_id');
      }
      else {
        var contentTypes = [ 'component', 'block', 'article', 'page' ];
        var contentCollections = [ 'components', 'blocks', 'articles', 'contentObjects' ];
        var id = Origin.location.route3;
        // note we start at the right point in the hierarchy
        // route2 === content type
        for(var i = _.indexOf(contentTypes, Origin.location.route2), count = contentTypes.length; i < count; i++) {
          if(contentTypes[i] === type) break;

          var match = Origin.editor.data[contentCollections[i]].findWhere({ _id:id });
          id = match.get('_parentId') || false;
        }
      }
      var search = {};
      search['workspaces.' + type] = { $in:[id] };
      this.applyFilter(search);
    }
  }, {
    template: 'assetManagementWorkspaceModule'
  });

  return AssetManagementWorkspaceModule;
});
