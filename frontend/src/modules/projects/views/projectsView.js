// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var ProjectView = require('./projectView');
  var SharedProjectView = require('./sharedProjectView');

  var ProjectsView = OriginView.extend({
    className: 'projects',

    preRender: function() {
      this.settings.preferencesKey = 'dashboard';

      this.initEventListeners();
      this.initUserPreferences();
    },

    postRender: function() {
      this.initPaging(_.bind(function() {
        this.resetCollection(this.setViewToReady);
      }, this));
    },

    initEventListeners: function() {
      this.listenTo(Origin, {
        'window:resize': this.initPaging,
        'dashboard:layout:grid': function() { this.doLayout('grid') },
        'dashboard:layout:list': function() { this.doLayout('list') },
        'dashboard:dashboardSidebarView:filterBySearch': function(text) { this.doFilter(text) },
        'dashboard:dashboardSidebarView:filterByTags': function(tags) { this.doFilter(null, tags) },
        'dashboard:sort:asc': function() { this.doSort('asc'); },
        'dashboard:sort:desc': function() { this.doSort('desc'); },
        'dashboard:sort:updated': function() { this.doSort('updated'); }
      });
      this.listenTo(this.collection, 'add', this.appendProjectItem);

      $('#app > .app-inner > .contentPane').scroll(_.bind(this.doLazyScroll, this));
    },

    initUserPreferences: function() {
      var prefs = this.getUserPreferences();

      this.doLayout(prefs.layout, false);
      this.doSort(prefs.sort, false);
      this.doFilter(prefs.search, prefs.tags, false);
      // set relevant filters as selected
      $("a[data-callback='dashboard:layout:grid']").addClass('selected');
      $("a[data-callback='dashboard:sort:asc']").addClass('selected');

      prefs = this.getUserPreferences();

      Origin.trigger('options:update:ui', prefs);
      Origin.trigger('sidebar:update:ui', prefs);
    },

    initPaging: function(cb) {
      // we need to load one course first to check page size
      this.pageSize = 1;
      this.resetCollection(_.bind(function(collection) {
        var containerHeight = $(window).height()-this.$el.offset().top;
        var containerWidth = this.$('.projects-inner').width();
        var itemHeight = $('.project-list-item').outerHeight(true);
        var itemWidth = $('.project-list-item').outerWidth(true);
        var columns = Math.floor(containerWidth/itemWidth);
        var rows = Math.floor(containerHeight/itemHeight);
        // columns stack nicely, but need to add extra row if it's not a clean split
        if((containerHeight % itemHeight) > 0) rows++;
        this.pageSize = columns*rows;

        if(typeof cb === 'function') {
          cb();
        }
      }, this));
    },

    getProjectsContainer: function() {
      return this.$('.projects-list');
    },

    emptyProjectsContainer: function() {
      Origin.trigger('dashboard:dashboardView:removeSubViews');
      this.getProjectsContainer().empty();
    },

    appendProjectItem: function(model) {
      var viewClass = model.isEditable() ? ProjectView : SharedProjectView;
      this.getProjectsContainer().append(new viewClass({ model: model }).$el);
    },

    convertFilterTextToPattern: function(filterText) {
      var pattern = '.*' + filterText.toLowerCase() + '.*';
      return { title: pattern };
    },

    resetCollection: function(cb) {
      this.emptyProjectsContainer();
      this.fetchCount = 0;
      this.shouldStopFetches = false;
      this.collection.reset();
      this.fetchCollection(cb);
    },

    fetchCollection: function(cb) {
      if(this.shouldStopFetches) {
        return;
      }
      this.isCollectionFetching = true;

      this.collection.fetch({
        data: {
          search: _.extend(this.search, { tags: { $all: this.tags } }),
          operators : {
            skip: this.fetchCount,
            limit: this.pageSize,
            sort: this.sort
          }
        },
        success: _.bind(function(collection, response) {
          this.isCollectionFetching = false;
          this.fetchCount += response.length;
          // stop further fetching if this is the last page
          if(response.length < this.pageSize) this.shouldStopFetches = true;

          this.$('.no-projects').toggleClass('display-none', this.fetchCount > 0);
          if(typeof cb === 'function') cb(collection);
        }, this)
      });
    },

    doLazyScroll: function(e) {
      if(this.isCollectionFetching) {
        return;
      }
      var $el = $(e.currentTarget);
      var pxRemaining = this.getProjectsContainer().height() - ($el.scrollTop() + $el.height());
      // we're at the bottom, fetch more
      if (pxRemaining <= 0) this.fetchCollection();
    },

    doLayout: function(layout) {
      var layouts = ["grid", "list"];
      if(_.indexOf(layouts, layout) === -1) {
        return;
      }
      var classSuffix = '-layout';
      this.getProjectsContainer()
        .removeClass(layouts.join(classSuffix + ' ') + classSuffix)
        .addClass(layout + '-layout');
      this.setUserPreference('layout', layout);
    },

    doSort: function(sort, fetch) {
      switch(sort) {
        case "desc":
          this.sort = { title: -1 };
          break;
        case "updated":
          this.sort = { updatedAt: -1 };
          break;
        case "asc":
        default:
          sort = "asc";
          this.sort = { title: 1 };
      }
      this.setUserPreference('sort', sort);
      if(fetch !== false) this.resetCollection();
    },

    doFilter: function(text, tags, fetch) {
      text = text || '';
      this.filterText = text;
      this.search = this.convertFilterTextToPattern(text || '');
      this.setUserPreference('search', text);

      tags = tags || [];
      this.tags = _.pluck(tags, 'id');
      this.setUserPreference('tags', tags);

      if(fetch !== false) this.resetCollection();
    }
  }, {
    template: 'projects'
  });

  return ProjectsView;
});
