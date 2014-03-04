define(function(require) {

  var Origin = require('coreJS/app/origin');
  var OriginView = require('coreJS/app/views/originView');
  var EditorPageCollection = require('coreJS/editor/collections/editorPageCollection');

  var EditorPageOverviewView = OriginView.extend({

      className: 'editor-page-overview',

      events: {
        "click a.load-page" : "goToPage"
      },

      preRender: function() {
        this.EditorPageCollection = new EditorPageCollection({_parentId:this.model.get('_parentId')});
        this.listenTo(this.EditorPageCollection, 'sync', this.addPageViews);
      },

      postRender: function() {

      },

      addPageViews: function() {
        this.$('.page-list').empty();
        _.each(this.EditorPageCollection.models, function(page) {
          this.$('.page-list').append('<li><a class="load-page" data-page-id="' + page.get('_id') + '" href="#">' + page.get('title') + '</a></li>');
        }, this);
      },

      goToPage: function (event) {
        event.preventDefault();
        Backbone.history.navigate('/editor/page/' + $(event.currentTarget).data('page-id'), {trigger: true});
      }

    }, {
      template: 'editorPageOverview'
  });

  return EditorPageOverviewView;

});
