// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
 * TODO I think this exists to add extra functionality to the menu/page structure pages
 */
define(function(require) {
  var Backbone = require('backbone');
  var Origin = require('core/origin');
  var helpers = require('core/helpers');

  var EditorOriginView = require('./editorOriginView');
  var EditorMenuView = require('../../contentObject/views/editorMenuView');
  var EditorPageView = require('../../contentObject/views/editorPageView');

  var ContentObjectModel = require('core/models/contentObjectModel');
  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ComponentModel = require('core/models/componentModel');

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
      Origin.editor.isPreviewPending = false;
      this.currentCourseId = Origin.editor.data.course.get('_id');
      this.currentCourse = Origin.editor.data.course;
      this.currentPageId = options.currentPageId;

      this.listenTo(Origin, {
        'editorView:refreshView': this.setupEditor,
        'editorView:copy': this.addToClipboard,
        'editorView:copyID': this.copyIdToClipboard,
        'editorView:paste': this.pasteFromClipboard,
        'editorCommon:download': this.downloadProject,
        'editorCommon:preview': function(isForceRebuild) {
          var previewWindow = window.open('loading', 'preview');
          this.previewProject(previewWindow, isForceRebuild);
        },
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

    previewProject: function(previewWindow, forceRebuild) {
      if(Origin.editor.isPreviewPending) {
        return;
      }
      Origin.editor.isPreviewPending = true;
      $('.navigation-loading-indicator').removeClass('display-none');
      $('.editor-common-sidebar-preview-inner').addClass('display-none');
      $('.editor-common-sidebar-previewing').removeClass('display-none');

      var url = 'api/output/'+Origin.constants.outputPlugin+'/preview/'+this.currentCourseId+'?force='+(forceRebuild === true);
      $.get(url, function(data, textStatus, jqXHR) {
        if (!data.success) {
          this.resetPreviewProgress();
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorgeneratingpreview') +
              Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
          previewWindow.close();
          return;
        }
        const pollUrl = data.payload && data.payload.pollUrl;
        if (pollUrl) {
          // Ping the remote URL to check if the job has been completed
          this.updatePreviewProgress(pollUrl, previewWindow);
          return;
        }
        this.updateCoursePreview(previewWindow);
        this.resetPreviewProgress();
      }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
        this.resetPreviewProgress();
        Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgeneric') });
        previewWindow.close();
      }.bind(this));
    },

    exportProject: function(error) {
      // TODO - very similar to export in project/views/projectView.js, remove duplication
      // aleady processing, don't try again
      if(error || this.exporting) return;

      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');

      var $btn = $('button.editor-common-sidebar-export');

      this.showExportAnimation(true, $btn);
      this.exporting = true;

      var self = this;
      $.ajax({
        url: 'export/' + tenantId + '/' + courseId,
        success: function(data, textStatus, jqXHR) {
          self.showExportAnimation(false, $btn);
          self.exporting = false;

          // get the zip
          var form = document.createElement('form');
          self.$el.append(form);
          form.setAttribute('action', 'export/' + tenantId + '/' + courseId + '/download.zip');
          form.submit();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          self.showExportAnimation(false, $btn);
          self.exporting = false;

          Origin.Notify.alert({
            type: 'error',
            title: Origin.l10n.t('app.exporterrortitle'),
            text: Origin.l10n.t('app.errorgeneric') +
              Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
        }
      });
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

    downloadProject: function() {
      if(Origin.editor.isDownloadPending) {
        return;
      }
      $('.editor-common-sidebar-download-inner').addClass('display-none');
      $('.editor-common-sidebar-downloading').removeClass('display-none');

      var url = 'api/output/' + Origin.constants.outputPlugin + '/publish/' + this.currentCourseId;
      $.get(url, function(data, textStatus, jqXHR) {
        if (!data.success) {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorgeneric') +
              Origin.l10n.t('app.debuginfo', { message: jqXHR.responseJSON.message })
          });
          this.resetDownloadProgress();
          return;
        }
        const pollUrl = data.payload && data.payload.pollUrl;
        if (pollUrl) {
          // Ping the remote URL to check if the job has been completed
          this.updateDownloadProgress(pollUrl);
          return;
        }
        this.resetDownloadProgress();

        var $downloadForm = $('#downloadForm');
        $downloadForm.attr('action', 'download/' + Origin.sessionModel.get('tenantId') + '/' + Origin.editor.data.course.get('_id') + '/' + data.payload.zipName + '/download.zip');
        $downloadForm.submit();

      }.bind(this)).fail(function(jqXHR, textStatus, errorThrown) {
        this.resetDownloadProgress();
        Origin.Notify.alert({ type: 'error', text: Origin.l10n.t('app.errorgeneric') });
      }.bind(this));
    },

    updatePreviewProgress: function(url, previewWindow) {
      var self = this;

      var pollUrl = function() {
        $.get(url, function(jqXHR, textStatus, errorThrown) {
          if (jqXHR.progress < "100") {
            return;
          }
          clearInterval(pollId);
          self.updateCoursePreview(previewWindow);
          self.resetPreviewProgress();
        }).fail(function(jqXHR, textStatus, errorThrown) {
          clearInterval(pollId);
          self.resetPreviewProgress();
          Origin.Notify.alert({ type: 'error', text: errorThrown });
          previewWindow.close();
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
      $('.editor-common-sidebar-preview-inner').removeClass('display-none');
      $('.editor-common-sidebar-previewing').addClass('display-none');
      $('.navigation-loading-indicator').addClass('display-none');
      $('.editor-common-sidebar-preview-wrapper .dropdown').removeClass('active');
      Origin.editor.isPreviewPending = false;
    },

    resetDownloadProgress: function() {
      $('.editor-common-sidebar-download-inner').removeClass('display-none');
      $('.editor-common-sidebar-downloading').addClass('display-none');
      Origin.editor.isDownloadPending = false;
    },

    updateCoursePreview: function(previewWindow) {
      var courseId = Origin.editor.data.course.get('_id');
      var tenantId = Origin.sessionModel.get('tenantId');
      previewWindow.location.href = 'preview/' + tenantId + '/' + courseId + '/';
    },

    addToClipboard: function(model) {
      var postData = {
        objectId: model.get('_id'),
        courseId: Origin.editor.data.course.get('_id'),
        referenceType: model._siblingTypes
      };
      $.post('api/content/clipboard/copy', postData, _.bind(function(jqXHR) {
        Origin.editor.clipboardId = jqXHR.clipboardId;
        this.showPasteZones(model.get('_type'));
      }, this)).fail(_.bind(function (jqXHR, textStatus, errorThrown) {
        Origin.Notify.alert({
          type: 'error',
          text: Origin.l10n.t('app.errorcopy') + (jqXHR.message ? '\n\n' + jqXHR.message : '')
        });
        this.hidePasteZones();
      }, this));
    },

    copyIdToClipboard: function(model) {
      var id = model.get('_id');

      if (helpers.copyStringToClipboard(id)) {
        Origin.Notify.alert({
          type: 'info',
          text: Origin.l10n.t('app.copyidtoclipboardsuccess', { id: id })
        });
      } else {
        Origin.Notify.alert({
          type: 'warning',
          text: Origin.l10n.t('app.app.copyidtoclipboarderror', { id: id })
        });
      }
    },

    pasteFromClipboard: function(parentId, sortOrder, layout) {
      Origin.trigger('editorView:pasteCancel');
      var postData = {
        id: Origin.editor.clipboardId,
        parentId: parentId,
        layout: layout,
        sortOrder: sortOrder,
        courseId: Origin.editor.data.course.get('_id')
      };
      $.post('api/content/clipboard/paste', postData, function(data) {
        Origin.editor.clipboardId = null;
        Origin.trigger('editorView:pasted:' + postData.parentId, {
          _id: data._id,
          sortOrder: postData.sortOrder
        });
      }).fail(function(jqXHR, textStatus, errorThrown) {
        Origin.Notify.alert({
          type: 'error',
          text: Origin.l10n.t('app.errorpaste') + (jqXHR.message ? '\n\n' + jqXHR.message : '')
        });
      });
    },

    createModel: function (type) {
      var model;
      switch (type) {
        case 'contentObjects':
          model = new ContentObjectModel();
          break;
        case 'articles':
          model = new ArticleModel();
          break;
        case 'blocks':
          model = new BlockModel();
          break;
        case 'components':
          model = new ComponentModel();
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
      (new ContentObjectModel({
        _id: this.currentPageId
      })).fetch({
        success: function(model) {
          var view = new EditorPageView({ model: model });
          this.$('.editor-inner').html(view.$el);
        },
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: 'app.errorfetchingdata'
          });
        }
      });
    },

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
