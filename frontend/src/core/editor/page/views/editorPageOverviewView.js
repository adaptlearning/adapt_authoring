// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');

  var EditorPageOverviewView = EditorOriginView.extend({
      settings: {
        autoRender: false
      },

      className: 'editor-page-overview',

      events: {
        "click a.load-page" : "goToPage"
      },

      preRender: function() {
        this.listenTo(Origin, 'editorSidebarView:removeEditView', this.remove);
        this.listenTo(Origin, 'editorView:refreshPageList', this.refreshProjectStructure);
        
        this.render();
        this.refreshProjectStructure();
      },

      postRender: function() {},

      /**
       * Converts an array of Backbone Models to a JavaScript tree structure
       * @param {Array} data
       * @return A JavaScript treeview-like object structure
       */
      convertModelsToTree: function(data){
        var map = {},
          flat = {},
          root = [];

        // Flatten the data
        for (var i = 0; i < data.length; i++) {
          var key = data[i].get('_id');

          flat[key] = {
            _id: data[i].get('_id'), 
            _type: data[i].get('_type'), 
            _parentId: data[i].get('_parentId'),
            title: data[i].get('title')
          };
        }

        // Add a 'children' container to each node
        for (var i in flat) {
          flat[i].children = []; 
        }

        // Populate any 'children' container arrays
        for (var i in flat) {
          var parentkey = flat[i]._parentId;

          if (flat[parentkey]) {
            flat[parentkey].children.push(flat[i]);
          }
        }

        // Find the root nodes (no parent found) and create the hierarchy tree from them
        for (var i in flat) {
          var parentkey = flat[i]._parentId;

          if (!flat[parentkey]) {
            root.push(flat[i]);
          }
        }

        return root;
      },

      /**
       * Creates a HTML string from a given items treeview structure
       * NOTE: string contatenation is faster here than DOM manipulation
       * @param {String} html
       * @param {Array} items
       * @return A HTML unordered list snippet
       */
      createOverviewTreeviewHtml: function(html, items) {
        html += '<ul class="fa-ul">'

        for (var i = 0; i < items.length; i++) {
          if (items[i].children.length != 0 || items[i]._type == 'menu') {
            html += '<li><i class="fa-li fa fa-folder-open-o"></i>' + items[i].title;
            html = this.createOverviewTreeviewHtml(html, items[i].children);
            html += '</li>';
          } else {
            html += '<li><i class="fa-li fa fa-file-o"></i><a class="load-page" data-page-id="' + items[i]._id + '" href="#">' + items[i].title + '</a></li>';
          }
        }

        html += '</ul>';

        return html;
      },

      /**
       * Clears and reloads the project tree structure
       */
      refreshProjectStructure: function() {
        var $projectOverview = this.$('.page-list'),
          listItems = this.convertModelsToTree(Origin.editor.data.contentObjects.models),
          html = '';

        $projectOverview.empty();

        html = this.createOverviewTreeviewHtml(html, listItems);

        $projectOverview.html(html);
      },

      goToPage: function (event) {
        event.preventDefault();

        Origin.router.navigate('/editor/' + Origin.editor.data.course.get('_id') + '/page/' + $(event.currentTarget).data('page-id'), {trigger: true});
      }

    }, {
      template: 'editorPageOverview'
  });

  return EditorPageOverviewView;

});
