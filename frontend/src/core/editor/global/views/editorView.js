// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorMenuView = require('editorMenu/views/editorMenuView');
  var EditorPageView = require('editorPage/views/editorPageView');
  /*var EditorCollection = require('editorGlobal/collections/editorCollection');*/
  var EditorModel = require('editorGlobal/models/editorModel');
  /*var EditorCourseModel = require('editorCourse/models/editorCourseModel');*/
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  var EditorArticleModel = require('editorPage/models/editorArticleModel');
  var EditorBlockModel = require('editorPage/models/editorBlockModel');
  var EditorComponentModel = require('editorPage/models/editorComponentModel');
  var EditorClipboardModel = require('editorGlobal/models/editorClipboardModel');
  var EditorComponentTypeModel = require('editorPage/models/editorComponentTypeModel');
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var EditorView = EditorOriginView.extend({

    settings: {
      autoRender: false
    },

    tagName: "div",

    className: "editor-view",

    events: {
      "click a.page-add-link"   : "addNewPage",
      "click a.load-page"       : "loadPage",
      "mouseover div.editable"  : "onEditableHoverOver",
      "mouseout div.editable"   : "onEditableHoverOut"
    },

    preRender: function(options) {
      this.currentView = options.currentView;
      Origin.editor.pasteParentModel = false;
      Origin.editor.isPreviewPending = false;
      this.currentCourseId = Origin.editor.data.course.get('_id');

      this.currentPageId = options.currentPageId;

      this.listenTo(Origin, 'editorView:refreshView', this.setupEditor);
      this.listenTo(Origin, 'editorView:copy', this.addToClipboard);
      this.listenTo(Origin, 'editorView:cut', this.cutContent);
      this.listenTo(Origin, 'editorView:paste', this.pasteFromClipboard);
      this.listenTo(Origin, 'editorCommon:publish', this.publishProject);
      this.listenTo(Origin, 'editorCommon:preview', this.previewProject);


      this.render();
      this.setupEditor();
    },

    postRender: function() {

    },

    onEditableHoverOver: function(e) {
      e.stopPropagation();
      $(e.currentTarget).addClass('hovering');
    },

    onEditableHoverOut: function(e) {
      $(e.currentTarget).removeClass('hovering');
    },

    setupEditor: function() {
      this.renderCurrentEditorView();
    },

    publishProject: function(event) {
      event && event.preventDefault();

      var canPublish = this.validateCourseContent();

      if (canPublish && !Origin.editor.isPublishPending) {
        $('.editor-common-sidebar-publishing-progress').animate({ width: '100%' }, 30000);
        $('.editor-common-sidebar-publish-inner').addClass('display-none');
        $('.editor-common-sidebar-publishing').removeClass('display-none');
        //return;
        var courseId = Origin.editor.data.course.get('_id');
        var tenantId = Origin.sessionModel.get('tenantId');

        $.get('/download/' + tenantId + '/' + courseId, function(data) {

          $('.editor-common-sidebar-publishing-progress').css('width', 0).stop();;
          Origin.editor.isPublishPending = false;
          $('.editor-common-sidebar-publish-inner').removeClass('display-none');
          $('.editor-common-sidebar-publishing').addClass('display-none');

          var $downloadForm = $('#downloadForm');

          $downloadForm.attr('action', '/download/' + tenantId + '/' + courseId + '/' + data.zipName + '/download.zip');
          $downloadForm.submit();
          
        });
        
      } else {
        return false;
      }
    },

    launchCoursePreview: function() {
      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');

      window.open('/preview/' + tenantId + '/' + courseId + '/main.html', 'preview');
    },

    previewProject: function(event) {
      event && event.preventDefault();

      var self = this;
      var canPreview = self.validateCourseContent();

      if (canPreview && !Origin.editor.isPreviewPending) {
        Origin.editor.isPreviewPending = true;
        $('.editor-common-sidebar-preview-inner').addClass('display-none');
        $('.editor-common-sidebar-previewing').removeClass('display-none');

        if (Origin.constants.outputPlugin == 'adapt') {
          // Report progress for 45 seconds
          $('.editor-common-sidebar-preview-progress').animate({ width: '100%' }, 45000); 
        }

        $.ajax({
          method: 'get',
          url: '/api/output/' + Origin.constants.outputPlugin + '/preview/' + this.currentCourseId,
          success: function (jqXHR, textStatus, errorThrown) {
            if (jqXHR.success) {
              if (jqXHR.payload && typeof(jqXHR.payload.pollUrl) != 'undefined' && jqXHR.payload.pollUrl != '') {
                // Ping the remote URL to check if the job has been completed
                self.updatePreviewProgress(jqXHR.payload.pollUrl);
              } else {
                self.launchCoursePreview();
                self.resetPreviewProgress();
              }                           
            } else {
              self.resetPreviewProgress();
              alert('Error generating preview, please contact Administrator');
            }
          },
          error: function (jqXHR, textStatus, errorThrown) {
            self.resetPreviewProgress();
            alert('Error');
            
          }
        });
      }
    },

    updatePreviewProgress: function(url) {
      var self = this;

      var pollUrl = function() {
        $.ajax({
          method: 'get',
          url: url,
          success: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.progress == "100") {
              clearInterval(pollId);
              self.launchCoursePreview();
              self.resetPreviewProgress();
            } else {
               $('.editor-common-sidebar-preview-progress').animate({ width: jqXHR.progress + '%' }, 1000);
            }
          },
          error: function(jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
          }
        });
      }
      
      // Check for updated progress every 3 seconds
      var pollId = setInterval(pollUrl, 3000);     
    },

    resetPreviewProgress: function() {
      $('.editor-common-sidebar-preview-progress').css('width', 0).stop();
      $('.editor-common-sidebar-preview-inner').removeClass('display-none');
      $('.editor-common-sidebar-previewing').addClass('display-none');
      Origin.editor.isPreviewPending = false;
    },

    /*
      Archive off the clipboard
    */
    addToClipboard: function(model) {
      _.defer(_.bind(function() {
        _.invoke(Origin.editor.data.clipboard.models, 'destroy')
      }, this));

      var self = this;
      var copiedObjectType = model.get('_type');

      $.ajax({
        method: 'post',
        url: '/api/content/clipboard/copy',
        data: {
          objectId: model.get('_id'), 
          courseId: Origin.editor.data.course.get('_id'),
          referenceType: model._siblings
        },
        success: function (jqXHR, textStatus, errorThrown) {
          if (!jqXHR.success) {
            alert(jqXHR.message);
            console.log(jqXHR);
          } else {
            Origin.editor.clipboardId = jqXHR.clipboardId;
            Origin.editor.pasteParentModel = model.getParent();
            self.showPasteZones(copiedObjectType);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert('Error during copy');
          console.log(jqXHR);
          console.log(textStatus);
          console.log(errorThrown);
        }
      });
    },

    pasteFromClipboard: function(parentId, sortOrder, layout) {
      $.ajax({
        method: 'post',
        url: '/api/content/clipboard/paste',
        data: {
          id: Origin.editor.clipboardId,
          parentId: parentId,
          layout: layout,
          sortOrder: sortOrder, 
          courseId: Origin.editor.data.course.get('_id')
        },
        success: function (jqXHR, textStatus, errorThrown) {
          if (!jqXHR.success) {
            alert(jqXHR.message);
            console.log(jqXHR);
          } else {
            Origin.editor.clipboardId = null;
            Origin.editor.pasteParentModel = null;
            Origin.trigger('editor:refreshData', function() {
              // TODO: HACK - I think this should probably pass a callback in
              // and return it with the new item - this way the individual views
              // can handle the new views and models
              Backbone.history.loadUrl();
            }, this);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert('Error during paste');
          console.log(jqXHR);
          console.log(textStatus);
          console.log(errorThrown);
        }
      });
    },

    createModel: function (type) {
      var model = false;
      switch (type) {
        case 'contentObjects':
          model = new EditorContentObjectModel();
          break;
        case 'articles':
          model = new EditorArticleModel();
          break;
        case 'blocks':
          model = new EditorBlockModel();
          break;
        case 'components':
          model = new EditorComponentModel();
          break;
      }
      return model;
    },

    renderCurrentEditorView: function() {
      Origin.trigger('editorView:removeSubViews');

      switch (this.currentView) {
        case 'menu':
          this.renderEditorMenu();
          break;
        case 'page':
          this.renderEditorPage();
          break;
      }

      Origin.trigger('editorSidebarView:addOverviewView');
    },

    renderEditorMenu: function() {
      this.$('.editor-inner').html(new EditorMenuView({
        model: Origin.editor.data.course
      }).$el);
    },

    renderEditorPage: function() {
      this.$('.editor-inner').html(new EditorPageView({
        model: Origin.editor.data.contentObjects.findWhere({_id: this.currentPageId}),
      }).$el);
    },

    cutContent: function(view) {
      var type = this.capitalise(view.model.get('_type'));
      var collectionType = view.model._siblings;

      this.addToClipboard(view.model);

      // Remove model from collection (to save fetching) and destroy it
      Origin.editor.data[collectionType].remove(view.model);
      view.model.destroy();

      _.defer(function(){
        Origin.trigger('editorView:cut' + type + ':' + view.model.get('_parentId'), view);
      });
    },

    validateCourseContent: function() {

      // Store current course
      var currentCourse = Origin.editor.data.course;

      // Let's do a standard check for at least one child object
      var containsAtLeastOneChild = true;

      var alerts = [];

      function interateOverChildren(model) {

        // Return the function if no children - on components
        if(!model._children) return;

        var currentChildren = model.getChildren();

        // Do validate across each item
        if (currentChildren.length == 0) {

          containsAtLeastOneChild = false;

          alerts.push(
            "There seems to be a "
              + model.get('_type')
              + " with the title - '"
              + model.get('title')
              + "' with no "
              + model._children
          );

          return;
        } else {

          // Go over each child and call validation again
          currentChildren.each(function(childModel) {
            interateOverChildren(childModel);
          });

        }

      }

      interateOverChildren(currentCourse);

      if(alerts.length > 0) {
        var errorMessage = "";
        for(var i = 0, len = alerts.length; i < len; i++) {
          errorMessage += "<li>" + alerts[i] + "</li>";
        }

        Origin.trigger('notify:alert', {
          title: "Validation failed",
          body: errorMessage,
          confirmText: "Ok",
          _callbackEvent: "editor:courseValidation",
          _showIcon: true
        });
      }

      return containsAtLeastOneChild;
    }

  }, {
    template: 'editor'
  });

  return EditorView;

});
