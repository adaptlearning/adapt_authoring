// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function (require) {
  var Backbone = require('backbone');
  var Handlebars = require('handlebars');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');
  const character_limit = 260;

  var MessageManagementView = OriginView.extend({
    tagName: 'div',
    className: 'message-management',

    preRender: function () {
      this.listenTo(Origin, 'messageManagementSidebar:views:save', this.saveMessage);
      this.listenTo(this.model, 'invalid', this.handleValidationError);
      CKEDITOR.plugins.addExternal('wordcount', '/wordcount/', 'plugin.js');
    },

    postRender: function () {
      this.initCKEditor('#generalRibbonEN');
      this.initCKEditor('#generalRibbonFR');
      var options = {
        showInput: true,
        preferredFormat: "hex",
        showPalette: true,
        palette: [
          ['#26374A', '#1C578A', '#1C578A'],
          ['#CD1C6A', '#69459C'],
          ['#E6E6E6', '#FFFFFF', '#000000'],
          ['#56cdb0', '#ecd000'],
        ]
      }
      $("#generalRibbonBgColor").spectrum(options);
      $("#generalRibbonTextColor").spectrum(options);
      $("#generalRibbonBgColor").spectrum("set", this.model.get('generalRibbonBgColor'));
      $("#generalRibbonTextColor").spectrum("set", this.model.get('generalRibbonTextColor'));
      this.setViewToReady();
    },

    initCKEditor: function (target) {
      var language = document.documentElement.lang;
      CKEDITOR.replace($(target)[0], {
        language: language,
        language_list: ['fr:Français', 'en:English'],
        skin: 'moono',
        dataIndentationChars: '',
        disableNativeSpellChecker: false,
        enterMode: CKEDITOR.ENTER_DIV,
        entities: false,
        extraAllowedContent: Origin.constants.ckEditorExtraAllowedContent,
        removePlugins: 'exportpdf',
        extraPlugins: 'notification, wordcount',
        wordcount: {
          showRemaining: true,
          showParagraphs: false,
          showWordCount: false,
          showCharCount: true,
          countBytesAsChars: false,
          countSpacesAsChars: true,
          countHTML: false,
          countLineBreaks: false,
          hardLimit: true,
          warnOnLimitOnly: false,
          maxWordCount: -1,
          maxCharCount: 345,
          maxParagraphs: -1,
          pasteWarningDuration: 0,
          filter: new CKEDITOR.htmlParser.filter({
            elements: {
              div: function (element) {
                if (element.attributes.class == 'mediaembed') {
                  return false;
                }
              }
            }
          })
        },
        on: {
          change: function () {
            this.trigger('change', this);
          }.bind(this),
          instanceReady: function () {
            var writer = this.dataProcessor.writer;
            var elements = Object.keys(CKEDITOR.dtd.$block);

            var rules = {
              indent: false,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
              defaultLanguage: 'fr'
            };

            writer.indentationChars = '';
            writer.lineBreakChars = '';
            elements.forEach(function (element) { writer.setRules(element, rules); });
          }
        },
        toolbar: [
          { name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Source', '-', 'ShowBlocks' ] },
          { name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'PasteText', '-', 'Undo', 'Redo' ] },
          { name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'SelectAll' ] },
          { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
          { name: 'links', items: [ 'Link', 'Unlink' ] },
          { name: 'insert', items: [ 'SpecialChar' ] },
          { name: 'tools', items: [] },
          { name: 'others', items: [ '-' ] }
        ]
      });
      CKEDITOR.on("instanceReady", function(event) {
        event.editor.on("beforeCommandExec", function(event) {
            // Show the paste dialog for the paste buttons and right-click paste
            if (event.data.name == "paste") {
                event.editor._.forcePasteDialog = true;
            }
            // Don't show the paste dialog for Ctrl+Shift+V
            if (event.data.name == "pastetext" && event.data.commandData.from == "keystrokeHandler") {
                event.cancel();
            }
        })
      });
    },

    handleValidationError: function (model, error) {
      Origin.trigger('sidebar:resetButtons');
      if (error && _.keys(error).length !== 0) {
        _.each(error, function (value, key) {
          this.$('#' + key + 'Error').text(value);
        }, this);
        this.$('.error-text').removeClass('display-none');
      }
    },

    saveMessage: function () {
      var self = this;

      this.$('.error-text').addClass('display-none');
      this.$('.error').text('');

      var toChange = {
        generalRibbonEnabled: self.$('#generalRibbonEnable')[0].checked,
        generalRibbonEN: CKEDITOR.instances['generalRibbonEN'].getData(),
        generalRibbonFR: CKEDITOR.instances['generalRibbonFR'].getData(),
        generalRibbonBgColor: $("#generalRibbonBgColor").spectrum('get').toHexString(),
        generalRibbonTextColor: $("#generalRibbonTextColor").spectrum('get').toHexString(),
      };

      _.extend(toChange, {
        _id: self.model.get('_id')
      });

      self.model.save(toChange, {
        wait: true,
        patch: true,
        error: function (data, error) {
          Origin.trigger('sidebar:resetButtons');
          Origin.Notify.alert({
            type: 'error',
            text: error.responseText || Origin.l10n.t('app.errorgeneric')
          });
        },
        success: function (model) {
          Backbone.history.history.back();
          Origin.trigger('messageManagementSidebar:views:saved');
        }
      });
    },
  }, {
    template: 'messageManagement'
  });

  return MessageManagementView;
});
