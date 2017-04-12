// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var EditorData = require('modules/editor/global/editorDataLoader');

  var LocationTitleView = Backbone.View.extend({
    el: '.location-title',

    initialize: function() {
      // initial render
      this.listenToOnce(Origin, 'editor:dataLoaded', this.render);
      this.listenTo(Origin, {
        'location:title:update': this.render,
        'location:title:hide': this.onHideTitle
      });
    },

    /**
    * Expects an object like the following: {
    *   title: String,
    *   breadcrumbs: Array
    * }
    */
    render: function(data) {
      this.processBreadcrumbData(data);

      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      _.defer(_.bind(this.postRender, this));

      return this;
    },

    postRender: function() {
      this.$('.location-title-inner').removeClass('display-none');
      Origin.trigger('location:title:postRender', this);
    },

    processBreadcrumbData: function(data) {
      if(!data) {
        return {};
      }
      var course = Origin.editor.data.course;
      // add some shortcuts to common locations
      if(data.breadcrumbs) {
        // Dashboard
        var dashboardI = _.indexOf(data.breadcrumbs, 'dashboard');
        if(dashboardI > -1) {
          data.breadcrumbs.splice(dashboardI, 1, { title: Origin.l10n.t('app.dashboard'), url: '#' });
        }
        // Course
        var courseI = _.indexOf(data.breadcrumbs, 'course');
        if(courseI > -1) {
          data.breadcrumbs.splice(courseI, 1, {
            title: Origin.l10n.t('app.editormenu'),
            url: '#/editor/' + course.get('_id') + '/menu'
          });
        }
      }
      // set title if there isn't one
      if(!data.title) {
        if(data.breadcrumbs) {
          data.title = data.breadcrumbs[data.breadcrumbs.length - 1].title;
        } else {
          data.title = course.get('title');
        }
      }
      return data;
    },

    onHideTitle: function() {
      this.$('.location-title-inner').addClass('display-none');
    }
  }, {
    template: 'locationTitle'
  });

  return LocationTitleView;
});
