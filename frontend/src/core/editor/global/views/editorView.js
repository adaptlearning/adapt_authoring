// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
 * TODO This needs a tidy:
 * - Remove commented lines
 * - Sort out error handling
 */
define(function(require){
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var Origin = require('coreJS/app/origin');
  var helpers = require('coreJS/app/helpers');
  var EditorOriginView = require('editorGlobal/views/editorOriginView');
  var EditorMenuView = require('editorMenu/views/editorMenuView');
  var EditorPageView = require('editorPage/views/editorPageView');
  var EditorModel = require('editorGlobal/models/editorModel');
  var EditorContentObjectModel = require('editorMenu/models/editorContentObjectModel');
  var EditorArticleModel = require('editorPage/models/editorArticleModel');
  var EditorBlockModel = require('editorPage/models/editorBlockModel');
  var EditorComponentModel = require('editorPage/models/editorComponentModel');
  var EditorClipboardModel = require('editorGlobal/models/editorClipboardModel');
  var EditorComponentTypeModel = require('editorPage/models/editorComponentTypeModel');
  var ExtensionModel = require('editorExtensions/models/extensionModel');

  var EditorView = EditorOriginView.extend({
    className: "editor-view",
    tagName: "div",

    settings: {
      autoRender: false
    },
    exporting: false,

    events: {
      "click a.page-add-link": "addNewPage",
      "click a.load-page": "loadPage",
      "mouseover div.editable": "onEditableHoverOver",
      "mouseout div.editable": "onEditableHoverOut"
    },

    preRender: function(options) {
      this.currentView = options.currentView;
      Origin.editor.pasteParentModel = false;
      Origin.editor.isPreviewPending = false;
      this.currentCourseId = Origin.editor.data.course.get('_id');
      this.currentCourse = Origin.editor.data.course;
      this.currentPageId = options.currentPageId;

      this.listenTo(Origin, {
        'editorView:refreshView': this.setupEditor,
        'editorView:copy': this.addToClipboard,
        'editorView:copyID': this.copyIdToClipboard,
        'editorView:cut': this.cutContent,
        'editorView:paste': this.pasteFromClipboard,
        'editorCommon:download': this.downloadProject,
        'editorCommon:preview': this.previewProject,
        'editorCommon:export': this.exportProject
      });

      this.render();
      this.setupEditor();
    },

    postRender: function() {

    },



    setupEditor: function() {
      this.renderCurrentEditorView();
    },

    downloadProject: function(e) {
      e && e.preventDefault();

      var self = this;

      if (helpers.validateCourseContent(this.currentCourse) && !Origin.editor.isDownloadPending) {
        $('.editor-common-sidebar-download-inner').addClass('display-none');
        $('.editor-common-sidebar-downloading').removeClass('display-none');

        if (Origin.constants.outputPlugin == 'adapt') {
          // Report progress for 45 seconds
          $('.editor-common-sidebar-downloading').animate({ width: '100%' }, 45000);
        }

        var courseId = Origin.editor.data.course.get('_id');
        var tenantId = Origin.sessionModel.get('tenantId');

        $.ajax({
          method: 'get',
          url: '/api/output/' + Origin.constants.outputPlugin + '/publish/' + this.currentCourseId,
          success: function (jqXHR, textStatus, errorThrown) {
            if (jqXHR.success) {
              if (jqXHR.payload && typeof(jqXHR.payload.pollUrl) != 'undefined' && jqXHR.payload.pollUrl != '') {
                // Ping the remote URL to check if the job has been completed
                self.updateDownloadProgress(jqXHR.payload.pollUrl);
              } else {
                self.resetDownloadProgress();

                var $downloadForm = $('#downloadForm');

                $downloadForm.attr('action', '/download/' + tenantId + '/' + courseId + '/' + jqXHR.payload.zipName + '/download.zip');
                $downloadForm.submit();
              }
            } else {
              self.resetDownloadProgress();

              Origin.Notify.alert({
                type: 'error',
                text: window.polyglot.t('app.errorgeneric')
              });
            }
          },
          error: function (jqXHR, textStatus, errorThrown) {
            self.resetDownloadProgress();

            Origin.Notify.alert({
              type: 'error',
              text: window.polyglot.t('app.errorgeneric')
            });
          }
        });
      } else {
        return false;
      }
    },

    exportProject: function(e) {
      e && e.preventDefault();

      // aleady processing, don't try again
      if(this.exporting) return;

      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');

      this.showExportAnimation();
      this.exporting = true;

      var self = this;
      $.ajax({
         url: '/export/' + tenantId + '/' + courseId,
         success: function(data, textStatus, jqXHR) {
           self.showExportAnimation(false);
           self.exporting = false;

           // get the zip
           var form = document.createElement('form');
           self.$el.append(form);
           form.setAttribute('action', '/export/' + tenantId + '/' + courseId + '/' + data.zipName + '/download.zip');
           form.submit();
         },
         error: function(jqXHR, textStatus, errorThrown) {
           var messageText = errorThrown;
           if(jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.message) messageText += ':<br/>' + jqXHR.responseJSON.message;

           self.showExportAnimation(false);
           self.exporting = false;

           Origin.Notify.alert({
             type: 'error',
             title: window.polyglot.t('app.exporterrortitle'),
             text: messageText
           });
         }
      });
    },

    showExportAnimation: function(show) {
      if(show !== false) {
        $('.editor-common-sidebar-export-inner').addClass('display-none');
        $('.editor-common-sidebar-exporting').removeClass('display-none');
      } else {
        $('.editor-common-sidebar-export-inner').removeClass('display-none');
        $('.editor-common-sidebar-exporting').addClass('display-none');
      }
    },

    launchCoursePreview: function() {
      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');

      window.open('/preview/' + tenantId + '/' + courseId + '/', 'preview');
    },

    previewProject: function(e) {
      e && e.preventDefault();

      var self = this;

      if (helpers.validateCourseContent(this.currentCourse) && !Origin.editor.isPreviewPending) {
        Origin.editor.isPreviewPending = true;
        $('.navigation-loading-indicator').removeClass('display-none');
        $('.editor-common-sidebar-preview-inner').addClass('display-none');
        $('.editor-common-sidebar-previewing').removeClass('display-none');

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
              Origin.Notify.alert({
                type: 'error',
                text: window.polyglot.t('app.errorgeneratingpreview')
              });
            }
          },
          error: function (jqXHR, textStatus, errorThrown) {
            self.resetPreviewProgress();
            Origin.Notify.alert({
              type: 'error',
              text: window.polyglot.t('app.errorgeneric')
            });
          }
        });
      }
    },

    updatePreviewProgress: function(url) {
      var self = this;

      var pollUrl = function() {
        $.get(url, function(jqXHR, textStatus, errorThrown) {
          if (jqXHR.progress < "100") {
            $('.navigation-loading-progress').animate({ width: jqXHR.progress + '%' }, 1000);
            return;
          }
          clearInterval(pollId);
          self.launchCoursePreview();
          self.resetPreviewProgress();
        }).fail(function(jqXHR, textStatus, errorThrown) {
          clearInterval(pollId);
          self.resetPreviewProgress();
          Origin.Notify.alert({ type: 'error', text: errorThrown });
        });
      }

      // Check for updated progress every 3 seconds
      var pollId = setInterval(pollUrl, 3000);
    },

    updateDownloadProgress: function(url) {
      // Check for updated progress every 3 seconds
      var pollId = setInterval(_.bind(function pollURL() {
        $.get(url, function(jqXHR, textStatus, errorThrown) {
          if (jqXHR.progress < "100") {
            $('.editor-common-sidebar-downloading-progress').animate({ width: jqXHR.progress + '%' }, 1000);
            return;
          }
          clearInterval(pollId);
          this.resetDownloadProgress();
        }).fail(function(jqXHR, textStatus, errorThrown) {
          clearInterval(pollId);
          this.resetDownloadProgress();
          Origin.Notify.alert({ type: 'error', text: errorThrown });
        });
      }, this), 3000);
    },

    resetPreviewProgress: function() {
      $('.navigation-loading-progress').css('width', 0).stop();
      $('.editor-common-sidebar-preview-inner').removeClass('display-none');
      $('.editor-common-sidebar-previewing').addClass('display-none');
      $('.navigation-loading-indicator').addClass('display-none');
      Origin.editor.isPreviewPending = false;
    },

    resetDownloadProgress: function() {
      $('.editor-common-sidebar-downloading-progress').css('width', 0).stop();
      $('.editor-common-sidebar-download-inner').removeClass('display-none');
      $('.editor-common-sidebar-downloading').addClass('display-none');
      Origin.editor.isDownloadPending = false;
    },

    addToClipboard: function(model) {
      _.defer(_.bind(function() { _.invoke(Origin.editor.data.clipboard.models, 'destroy') }, this));

      var postData = {
        objectId: model.get('_id'),
        courseId: Origin.editor.data.course.get('_id'),
        referenceType: model._siblings
      };

      $.post('/api/content/clipboard/copy', postData, _.bind(function(jqXHR, textStatus, errorThrown) {
          if (!jqXHR.success) {
            Origin.Notify.alert({ type: 'error', text: jqXHR.message });
            return;
          }
          Origin.editor.clipboardId = jqXHR.clipboardId;
          Origin.editor.pasteParentModel = model.getParent();
          this.showPasteZones(model.get('_type'));
        }, this)).fail(function (jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorcopy') });
        });
      });
    },

    copyIdToClipboard: function(model) {
      var id = model.get('_id');

      if (helpers.copyStringToClipboard(id)) {
        Origin.Notify.alert({
          type: 'success',
          text: window.polyglot.t('app.copyidtoclipboardsuccess', { id: id })
        });
      } else {
        Origin.Notify.alert({
          type: 'warning',
          text: window.polyglot.t('app.app.copyidtoclipboarderror', { id: id })
        });
      }
    },

    pasteFromClipboard: function(parentId, sortOrder, layout) {
      $.post('/api/content/clipboard/paste', function(jqXHR, textStatus, errorThrown) {
        if (!jqXHR.success) {
          Origin.Notify.alert({ type: 'error', text: jqXHR.message });
          return;
        }
        Origin.editor.clipboardId = null;
        Origin.editor.pasteParentModel = null;
        Origin.trigger('editor:refreshData', function() {
          // TODO: HACK - I think this should probably pass a callback in
          // and return it with the new item - this way the individual views
          // can handle the new views and models
          Backbone.history.loadUrl();
        }, this);
      }, this).fail(function(jqXHR, textStatus, errorThrown) {
        Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorpaste') });
      });
    },

    createModel: function (type) {
      var model;
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

      if(this.currentView === 'menu') {
        this.renderEditorMenu();
      } else if(this.currentView === 'page') {
        this.renderEditorPage();
      }

      Origin.trigger('editorSidebarView:addOverviewView');
    },

    renderEditorMenu: function() {
      var view = new EditorMenuView({ model: Origin.editor.data.course });
      this.$('.editor-inner').html(view.$el);
    },

    renderEditorPage: function() {
      var view = new EditorPageView({
        model: Origin.editor.data.contentObjects.findWhere({ _id: this.currentPageId })
      });
      this.$('.editor-inner').html(view.$el);
    },

    cutContent: function(view) {
      var type = helpers.capitalise(view.model.get('_type'));
      var collectionType = view.model._siblings;

      this.addToClipboard(view.model);

      // Remove model from collection (to save fetching) and destroy it
      Origin.editor.data[collectionType].remove(view.model);
      view.model.destroy();

      _.defer(function () {
        Origin.trigger('editorView:cut' + type + ':' + view.model.get('_parentId'), view);
      });
    }

    /**
    * Event handling
    */

    onEditableHoverOver: function(e) {
      e && e.stopPropagation();
      $(e.currentTarget).addClass('hovering');
    },

    onEditableHoverOut: function(e) {
      $(e.currentTarget).removeClass('hovering');
    }
  }, {
    template: 'editor'
  });

  return EditorView;
});
