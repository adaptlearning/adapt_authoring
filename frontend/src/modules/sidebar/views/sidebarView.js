// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var SidebarActionButtonView = require('./sidebarActionButtonView');
  var SidebarLinkButtonView = require('./sidebarLinkButtonView');
  var SidebarFilterView = require('./sidebarFilterView');
  var SidebarFieldsetFilterView = require('./sidebarFieldsetFilterView');

  var Sidebar = OriginView.extend({
    className: 'sidebar',

    initialize: function(options) {
      OriginView.prototype.initialize.apply(this, arguments);

      this.resetModel();
      // TODO why can't I do listenTo?!
      Origin.on({
        // 'sidebar:filter:add': this.renderFilterView.bind(this),
        'sidebar:action:cancel sidebar:link:back': this.goBack.bind(this)
      });
    },

    resetModel: function(data) {
      data = data || {};
      this.model = new Backbone.Model({
        backButton: data.backButton,
        actions: data.actions || [],
        links: data.links || [],
        fieldsets: data.fieldsets || [],
        widgets: data.widgets || []
      });
    },

    update: function(options) {
      this.resetModel(options);
      this.render();
    },

    show: function() {
      $('html').removeClass('sidebar-hide');
      this.$('.group').velocity({ 'left': '0%', 'opacity': 1 }, 'easeOutQuad');
    },

    hide: function() {
      $('html').addClass('sidebar-hide');
      this.$('.group').velocity({ 'left': '10%', 'opacity': 0 }, 'easeOutQuad');
    },

    postRender: function() {
      this.emptyContainers();
      this.renderBackButton();
      this.renderGroups();
      this.show();
      Origin.trigger('sidebar:ready');
    },

    emptyContainers: function() {
      this.$('.back-button').empty();
      this.$('.group').empty();
    },

    renderBackButton: function() {
      var data = this.model.get('backButton');
      if(!data) {
        return this.hideEl(this.$('.back-button'));
      }
      data.name = data.page = 'back';
      data.icon = 'fa-chevron-left';

      var view = new SidebarLinkButtonView({ model: new Backbone.Model(data) });
      var $el = this.$('.back-button.group');
      $el.html(view.$el);
      this.showEl($el);
    },

    renderGroups: function() {
      var groups = [
        { name: 'actions', func: this.renderActionButton },
        { name: 'links', func: this.renderLinkButton },
        { name: 'fieldsets', func: this.renderFieldsetFilter },
        { name: 'widgets', func: this.renderWidget },
      ];
      groups.forEach(function(group) {
        var items = this.model.get(group.name);
        if(items && items.length) items.forEach(group.func, this);
      }.bind(this));
    },

    renderActionButton: function(data, index) {
      this.attachHTML(new SidebarActionButtonView({ model: new Backbone.Model(data) }).$el, this.$('.actions.group'), index);
    },

    renderLinkButton: function(data, index) {
      this.attachHTML(new SidebarLinkButtonView({ model: new Backbone.Model(data) }).$el, this.$('.links.group'), index);
    },

    renderFieldsetFilter: function(data) {
      var view = new SidebarFieldsetFilterView({ model: new Backbone.Model(data.schema) });
      this.attachHTML(view.$el, this.$('.fieldsets.group'));
    },

    renderWidget: function($el, index) {
      this.attachHTML($el, this.$('.widgets.group'));
    },

    /*
    renderFilterView: function(options) {
      Origin.trigger('sidebar:sidebarFilter:remove');
      $('body').append(new SidebarFilterView(options).$el);
    },
    */

    /**
    * A number of assumptions are made here:
    * - $el is a valid jQuery object
    * - $container is a direct parent of the children to be used for ordering
    * - index value is zero-indexed
    */
    attachHTML: function($el, $container, index) {
      var children = $container.children();
      // deal with unexpected values by just appending
      if(children.length === 0 || index === undefined || index < 0 || index > children.length-1) {
        return $container.append($el);
      }
      children[index].after($el);
    },

    showEl: function($el) {
      $el.show();
    },

    hideEl: function($el) {
      $el.hide();
    },

    showErrors: function(errors) {
      this.$('.sidebar-fieldset-filter').removeClass('error');

      if (!errors) return;

      // add a visual cue for any fieldsets with errors
      _.each(errors, function(error, attribute) {
        _.each(this.form.options.fieldsets, function(fieldset, key) {
          if(!_.contains(fieldset.fields, attribute)) return;
          this.$('.sidebar-fieldset-filter-' + fieldset.key).addClass('error');
        }, this);
      }, this);
    },

    goBack: function(model) {
      var route = model.get('route');
      if(route) {
        return Origin.router.navigateTo(route);
      }
      Origin.router.navigateBack();
    }
  }, {
    template: 'sidebar'
  });

  return Sidebar;
});
