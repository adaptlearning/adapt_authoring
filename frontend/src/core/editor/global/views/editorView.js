// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
 * TODO This needs a tidy:
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
    settings: {
      autoRender: false
    },
    exporting: false,
    exportingHtml: false,
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
        'editorCommon:export': this.exportProject,
        'editorCommon:exportHtml': this.exportHtml
      });

      this.render();
      this.setupEditor();
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
      var view = new EditorMenuView({ model: Origin.editor.data.course })
      this.$('.editor-inner').html(view.$el);
    },

    renderEditorPage: function() {
      var view = new EditorPageView({ model: Origin.editor.data.contentObjects.findWhere({ _id: this.currentPageId }) });
      this.$('.editor-inner').html(view.$el);
    },

    postRender: function() {

    },

    setupEditor: function() {
      this.renderCurrentEditorView();
    },

    showExportAnimation: function(show, $btn) {
      if(show !== false) {
        $('.editor-common-sidebar-export-inner', $btn).addClass('display-none');
        $('.editor-common-sidebar-exporting', $btn).removeClass('display-none');
      } else {
        $('.editor-common-sidebar-export-inner', $btn).removeClass('display-none');
        $('.editor-common-sidebar-exporting', $btn).addClass('display-none');
      }
    },

    toggleExportHtmlAnimation() {
      $('.editor-common-sidebar-export-html-inner')
        .toggleClass("display-none", this.exportingHtml);
      $('.editor-common-sidebar-exporting-html')
        .toggleClass("display-none", !this.exportingHtml);
    },

    launchCoursePreview: function() {
      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');
      window.open('/preview/' + tenantId + '/' + courseId + '/', 'preview');
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
               $('.navigation-loading-progress').animate({ width: jqXHR.progress + '%' }, 1000);
            }
          },
          error: function(jqXHR, textStatus, errorThrown) {
            clearInterval(pollId);
            self.resetPreviewProgress();
            Origin.Notify.alert({ type: 'error', text: errorThrown });
          }
        });
      }

      // Check for updated progress every 3 seconds
      var pollId = setInterval(pollUrl, 3000);
    },

    updateDownloadProgress: function(url) {
      var self = this;

      var pollUrl = function() {
        $.ajax({
          method: 'get',
          url: url,
          success: function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.progress == "100") {
              clearInterval(pollId);

              self.resetDownloadProgress();
            } else {
               $('.editor-common-sidebar-downloading-progress').animate({ width: jqXHR.progress + '%' }, 1000);
            }
          },
          error: function(jqXHR, textStatus, errorThrown) {
            clearInterval(pollId);
            self.resetDownloadProgress();
            Origin.Notify.alert({ type: 'error', text: errorThrown });
          }
        });
      }

      // Check for updated progress every 3 seconds
      var pollId = setInterval(pollUrl, 3000);
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

    /*
    * Clipboard
    */

    copyIdToClipboard: function(model) {
      var id = model.get('_id');
      if (helpers.copyStringToClipboard(id)) {
        Origin.Notify.alert({
          type: 'success',
          text: window.polyglot.t('app.copyidtoclipboardsuccess', {id: id})
        });
      } else {
        Origin.Notify.alert({
          type: 'warning',
          text: window.polyglot.t('app.app.copyidtoclipboarderror', {id: id})
        });
      }
    },

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
            Origin.Notify.alert({
              type: 'error',
              text: jqXHR.message
            });
          } else {
            Origin.editor.clipboardId = jqXHR.clipboardId;
            Origin.editor.pasteParentModel = model.getParent();
            self.showPasteZones(copiedObjectType);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorcopy') });
        }
      });
    },

    cutContent: function(view) {
      var type = this.capitalise(view.model.get('_type'));
      var collectionType = view.model._siblings;

      this.addToClipboard(view.model);

      // Remove model from collection (to save fetching) and destroy it
      Origin.editor.data[collectionType].remove(view.model);
      view.model.destroy();

      _.defer(function () {
        Origin.trigger('editorView:cut' + type + ':' + view.model.get('_parentId'), view);
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
        success: _.bind(function(jqXHR, textStatus, errorThrown) {
          if (!jqXHR.success) {
            Origin.Notify.alert({
              type: 'error',
              text: jqXHR.message
            });
          } else {
            Origin.editor.clipboardId = null;
            Origin.editor.pasteParentModel = null;
            // TODO callback to allow views to control what happens next?
            Origin.trigger('editor:refreshData', this.setupEditor, this);
          }
        }, this),
        error: function (jqXHR, textStatus, errorThrown) {
          Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorpaste') });
        }
      });
    },

    /*
    * Events
    */

    onEditableHoverOver: function(e) {
      e && e.stopPropagation();
      $(e.currentTarget).addClass('hovering');
    },

    onEditableHoverOut: function(e) {
      $(e.currentTarget).removeClass('hovering');
    },

    previewProject: function(forceRebuild) {
      var self = this;


      if (helpers.validateCourseContent(this.currentCourse) && !Origin.editor.isPreviewPending) {
        Origin.editor.isPreviewPending = true;
        $('.navigation-loading-indicator').removeClass('display-none');
        $('.editor-common-sidebar-preview-inner').addClass('display-none');
        $('.editor-common-sidebar-previewing').removeClass('display-none');

        $.ajax({
          method: 'get',
          url: '/api/output/' + Origin.constants.outputPlugin + '/preview/' + this.currentCourseId + '?force=' + (forceRebuild === true),
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
            Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorgeneric') });
          }
        });
      }
    },

    downloadProject: function() {
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
            Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorgeneric') });
          }
        });
      } else {
        return false;
      }
    },

    exportProject: function(devMode) {
      // aleady processing, don't try again
      if(this.exporting) return;

      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');

      var $btn = devMode == true ? $('button.editor-common-sidebar-export-dev') : $('button.editor-common-sidebar-export');

      this.showExportAnimation(true, $btn);
      this.exporting = true;

      var self = this;
      $.ajax({
         url: '/export/' + tenantId + '/' + courseId + '/' + devMode,
         success: function(data, textStatus, jqXHR) {
           self.showExportAnimation(false, $btn);
           self.exporting = false;

           // get the zip
           var form = document.createElement('form');
           self.$el.append(form);
           form.setAttribute('action', '/export/' + tenantId + '/' + courseId + '/download.zip');
           form.submit();
         },
         error: function(jqXHR, textStatus, errorThrown) {
           var messageText = errorThrown;
           if(jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.message) messageText += ':<br/>' + jqXHR.responseJSON.message;

           self.showExportAnimation(false, $btn);
           self.exporting = false;

           Origin.Notify.alert({
             type: 'error',
             title: window.polyglot.t('app.exporterrortitle'),
             text: messageText
           });
         }
      });
    },

    exportHtml: function() {
      if (this.exportingHtml) {
        return;
      }

      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');
      var self = this;

      this.exportingHtml = true;
      self.toggleExportHtmlAnimation();

      $.ajax({
        url: '/exportHtml/' + tenantId + '/' + courseId,
        success: function(data) {
          self.exportingHtml = false;
          self.toggleExportHtmlAnimation();

          $('<form/>', {
            action: '/downloadHtml/' + data.courseTitle + '/download.zip'
          }).submit();
         },
        error: function(jqXHR, textStatus, errorThrown) {
          var responseJSON = jqXHR ? jqXHR.responseJSON : null;
          var message = responseJSON ? responseJSON.message : null;

          if (message) errorThrown += ':<br>' + message;

          self.exportingHtml = false;
          self.toggleExportHtmlAnimation();

          Origin.Notify.alert({
            type: 'error',
            title: window.polyglot.t('app.exporterrortitle'),
            text: errorThrown 
          });
        }
      });
    }
  }, {
    template: 'editor'
  });

  return EditorView;
});
