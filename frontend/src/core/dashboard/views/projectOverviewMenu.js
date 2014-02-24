//@TODO course|project
define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var BuilderView = require('coreJS/app/views/builderView');

  var ProjectOverviewMenu = BuilderView.extend({

    tagName: "div",

    className: "project-menu",

    events: {
      'click a': 'navclick'
    },

    preRender: function () {
      this.listenTo(this.model, 'change', this.render);
    },

    navclick: function (ev) {
      ev.preventDefault();

      var act = $(ev.target).data('action');

      if (act) {
        act = act.split('-');

        switch(act[0]){
          case 'add':
            switch(act[1]){
              default:
                alert('Add action not implemented');
              break;
            }
          break;
          default:
            alert('Action not implemented');
          break;
        }
      }
    }

  }, {
    template: 'part_projectOverviewMenu'
  });

  return ProjectOverviewMenu;

});