define(function(require) {

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');

  var EditorPageOverviewView = OriginView.extend({
      settings: {
        autoRender: false
      },

      className: 'editor-page-overview',

      events: {
        "click a.load-page" : "goToPage"
      },

      preRender: function() {

        this.render();
        this.addPageViews();
      },

      postRender: function() {

      },
// loop through the contentObject in the model and build the list in the overview sidebar 
      addPageViews: function() {

        this.$('.page-list').empty();

        _.each(Origin.editor.data.contentObjects.models, function(contentObject) {
          if (contentObject.get('_type') == 'page') {
            this.$('.page-list').append('<li><a class="load-page" data-page-id="' + contentObject.get('_id') + '" href="#">' + contentObject.get('title') + '</a></li>');
          }
        }, this);

      },

      goToPage: function (event) {
        event.preventDefault();
        Backbone.history.navigate('/editor/' + Origin.editor.data.course.get('_id') + '/page/' + $(event.currentTarget).data('page-id'), {trigger: true});
      }

    }, {
      template: 'editorPageOverview'
  });

  return EditorPageOverviewView;

});
