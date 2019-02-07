// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Origin = require('core/origin');

  var EditorDataLoader = require('modules/editor/global/editorDataLoader');

  var LocationTitleView = Backbone.View.extend({
    el: '.location-title',

    initialize: function() {
      this.listenTo(Origin, {
        'location:title:update': this.render,
        'location:title:hide': this.onHideTitle
      });
      EditorDataLoader.waitForLoad(_.bind(this.render, this));
    },

    render: function(data) {
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(this.processData(data)));
      _.defer(_.bind(this.postRender, this));
      return this;
    },

    processData: function(data) {
      // nothing to do
      if(!data || !data.breadcrumbs) {
        return data;
      }
      // add some shortcuts to common locations
      var course = Origin.editor.data.course;
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
      if(course) data.course = course.toJSON();

      return data;
    },

    postRender: function() {
      this.$('.location-title-inner').removeClass('display-none');
      Origin.trigger('location:title:postRender', this);
    },

    onHideTitle: function() {
      this.$('.location-title-inner').addClass('display-none');
    }
  }, {
    template: 'locationTitle'
  });

  return LocationTitleView;
});
