// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('coreJS/app/origin');
  var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
  var AssetManagementNewAssetView = require('coreJS/assetManagement/views/assetManagementNewAssetView');
  var AssetManagementNewAssetSidebarView = require('coreJS/assetManagement/views/assetManagementNewAssetSidebarView');
  var AssetManagementSidebarView = require('coreJS/assetManagement/views/assetManagementSidebarView');
  var AssetManagementView = require('coreJS/assetManagement/views/assetManagementView');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var ProjectCollection = require('coreJS/project/collections/projectCollection');
  var TagsCollection = require('coreJS/tags/collections/tagsCollection');

  Origin.on('app:dataReady login:changed', function() {
    Origin.globalMenu.addItem({
      "location": "global",
      "text": "Asset Management",
      "icon": "fa-file-image-o",
      "callbackEvent": "assetManagement:open",
      "sortOrder": 2
    });
  });

  Origin.on('globalMenu:assetManagement:open', function() {
    Origin.router.navigate('#/assetManagement', { trigger: true });
  });

  Origin.on('router:assetManagement', function(location, subLocation, action) {
    Origin.assetManagement = {
      filterData: {}
    };

    // load the right view...
    if(!location) {
      loadCollectionView();
    }
    else if(location === 'new') {
      loadAssetView();
    }
    else if(subLocation === 'edit'){
      loadAssetView(location);
    }
  });

  Origin.on('superToolbar:buildthumbs', function() {
    $.post('api/asset/buildthumbs')
      .done(function(data, textStatus, jqXHR) {
        Origin.Notify.alert({ type: 'success', text: 'Missing thumbnails have been created.<br/>Please refresh the page to see the changes.' });
      })
      .fail(function(data, textStatus, jqXHR) {
        Origin.Notify.alert({ type: 'error', text: 'Thumbnail build failed.' });
      });
  });
  Origin.on('superToolbar:syncworkspaces', function() {
    $.post('api/asset/syncworkspaces')
      .done(function(data, textStatus, jqXHR) {
        Origin.Notify.alert({ type: 'success', text: "Assets have been linked with courses they are used in." });
      })
      .fail(function(data, textStatus, jqXHR) {
        Origin.Notify.alert({ type: 'error', text: 'Failed to set workspaces.' });
      });
  });

  function loadCollectionView() {
    new TagsCollection().fetch({
      success: function(tags) {
        // Sidebar also needs access to collection, so create now. Fetch is done
        // in collectionView (thanks to server-side filtering)
        var assetCollection = new AssetCollection();
        Origin.trigger('location:title:hide');
        Origin.sidebar.addView(new AssetManagementSidebarView({ collection: tags }).$el );
        Origin.router.createView(AssetManagementView, { collection: assetCollection });
        Origin.trigger('assetManagement:loaded');

        loadSuperTools();
      },
      error: handleError
    });
  };

  function loadSuperTools() {
    Origin.trigger('superToolbar:add', [
      {
        title: 'Build thumbs',
        icon: 'fa-wrench',
        event: 'buildthumbs'
      },
      {
        title: 'Link workspaces',
        icon: 'fa-link',
        event: 'syncworkspaces'
      }
    ]);
  };

  function loadAssetView(id) {
    var isNew = id === undefined;
    // TODO localise this
    var title = isNew ? 'New Asset' : 'Edit Asset';
    Origin.trigger('location:title:update', { title: title} );

    var data = isNew ? {} : { _id: id };
    var model = new AssetModel(data);
    // needed for filtering
    new ProjectCollection().fetch({
      success: function(projects) {
        model.set('projects', filterProjects(projects));
        if(isNew) loadView();
        else model.fetch({ success:loadView });
      }
    });

    function loadView() {
      Origin.sidebar.addView(new AssetManagementNewAssetSidebarView().$el, {
        "backButtonText": "Back to assets",
        "backButtonRoute": "/#/assetManagement"
      });
      Origin.router.createView(AssetManagementNewAssetView, { model: model });
    };
  };

  // filters out projects that aren't 'mine' OR shared
  // @return just the  _ids and titles
  function filterProjects(projects) {
    return projects.filter(function(project) {
      var shared = project.get('_isShared') === true;
      var mine = project.get('createdBy') === Origin.sessionModel.get('_id');
      return shared || mine;
    }).map(function(project) {
      return {
        _id: project.get('_id'),
        title: project.get('title')
      };
    });
  };

  function handleError() {
    Origin.Notify.alert({
      type: 'error',
      text: 'An error occured fetching data - try refreshing your page'
    });
  };
});
