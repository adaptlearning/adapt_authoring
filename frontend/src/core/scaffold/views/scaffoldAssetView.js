// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var BackboneForms = require('backboneForms');
  var Origin = require('coreJS/app/origin');
  var Helpers = require('coreJS/app/helpers');
  var AssetModel = require('coreJS/assetManagement/models/assetModel');
  var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
  var AssetManagementModalView = require('coreJS/assetManagement/views/assetManagementModalView');
  var EditorCourseAssetModel = require('editorCourse/models/editorCourseAssetModel');
  var ScaffoldAssetEditView = require('coreJS/scaffold/views/scaffoldAssetEditView');

  var ScaffoldAssetView = Backbone.Form.editors.Base.extend({
    tagName: 'div',

    events: {
      // triggered whenever something happens that affects the result of `this.getValue()`
      'change input': function() {
        this.trigger('change', this);
      },
      // triggered whenever an input becomes the `document.activeElement`
      'focus input': function() {
        // This call automatically sets `this.hasFocus` to `true`
        this.trigger('focus', this);
      },
      // triggered whenever an input stops being the `document.activeElement`
      'blur input': function() {
        // This call automatically sets `this.hasFocus` to `false`
        this.trigger('blur', this);
      },

      'click .scaffold-asset-picker': 'onAssetButtonClicked',
      'click .scaffold-asset-edit': 'onEditButtonClicked',
      'click .scaffold-asset-change': 'onChangeButtonClicked',
      'click .scaffold-asset-clear': 'onClearButtonClicked',

      'click .scaffold-asset-external': 'onExternalAssetButtonClicked',
      'click .scaffold-asset-external-input-save': 'onExternalAssetSaveClicked',
      'click .scaffold-asset-external-input-cancel': 'onExternalAssetCancelClicked'
    },

    initialize: function(options) {
      this.listenTo(Origin, 'scaffold:assets:autofill', this.onAutofill);
      this.listenTo(Origin, 'modal:onUpdate', this.render);
      // Call parent constructor
      Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    },

    render: function() {
      var assetType = this.schema.fieldType.replace('Asset:', '');
      var data = {
        value: this.value,
        type: assetType
      };

      this.$el.html(Handlebars.templates[this.constructor.template](data));
      this.setValue(this.value);

      return this;
    },

    focus: function() {
      if(!this.hasFocus) this.$('input').focus();
    },

    blur: function() {
      if (this.hasFocus) this.$('input').blur();
    },

    showFileUI: function(show) {
      console.log('showFileUI:', show);
      if(show === false) {
        this.$('.scaffold-asset-preview').addClass('display-none');
        this.$('.scaffold-asset-edit-buttons').addClass('display-none');
      } else {
        this.$('.scaffold-asset-preview').removeClass('display-none');
        this.$('.scaffold-asset-edit-buttons').removeClass('display-none');
      }
    },

    showInputUI: function(show) {
      if(show === false) {
        this.$('.scaffold-asset-external-input').addClass('display-none');
        this.$('.scaffold-asset-picker-buttons').removeClass('display-none');
      } else {
        this.$('.scaffold-asset-external-input').removeClass('display-none');
        this.$('.scaffold-asset-picker-buttons').addClass('display-none');
      }
    },

    saveModel: function(shouldResetAssetCollection, attributesToSave) {
      var isUsingAlternativeModel = false;
      var isPatch = false;

      var currentModel = Origin.scaffold.getCurrentModel()
      var alternativeModel = Origin.scaffold.getAlternativeModel();
      var alternativeAttribute = Origin.scaffold.getAlternativeAttribute();

      attributesToSave = typeof attributesToSave == 'undefined' ? [] : attributesToSave;

      // Check if alternative model should be used
      if (alternativeModel) {
        currentModel = alternativeModel;
        isUsingAlternativeModel = true;
      }

      // store data state
      Origin.scaffold.getCurrentForm().commit({ validate: false });

      // Check if alternative attribute should be used
      if (alternativeAttribute) {
        attributesToSave[alternativeAttribute] = Origin.scaffold.getCurrentModel().attributes;
      }

      if (!attributesToSave && !attributesToSave.length) {
       currentModel.pruneAttributes();
       currentModel.unset('tags');
      } else {
        isPatch = true;
      }

      currentModel.save(attributesToSave, {
        patch: isPatch,
        error: function() {
          Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorsaveasset') });
        },
        success: _.bind(function() {
          // Sometimes we don't need to reset the courseAssets
          if (shouldResetAssetCollection) {
            Origin.editor.data.courseAssets.fetch({
              reset: true,
              success: _.bind(this.onSaveSuccess, this)
            });
          } else {
            this.onSaveSuccess();
          }
        }, this)
      })
    },

    /**
    * Data handlers
    */

    getValue: function() {
      return this.value || '';
    },

    setValue: function(value) {
      this.value = value;
    },

    findAsset: function (contentTypeId, contentType, fieldname) {
      var searchCriteria = {
        _contentType: contentType,
        _fieldName: fieldname
      };
      if (contentTypeId) {
        searchCriteria._contentTypeId = contentTypeId;
      } else {
        searchCriteria._contentTypeParentId = Origin.editor.data.course.get('_id');
      }

      var asset = Origin.editor.data.courseAssets.findWhere(searchCriteria);

      // HACK - Try relaxing the search criteria for historic data
      // TODO is this still needed?
      if (!asset) {
        asset = Origin.editor.data.courseAssets.findWhere({
          _contentType: contentType,
          _fieldName: fieldname
        });
      }

      return asset ? asset : false;
    },

    createCourseAsset: function (courseAssetObject) {
      var self = this;

      var courseAsset = new EditorCourseAssetModel();
      courseAsset.save({
        _courseId : Origin.editor.data.course.get('_id'),
        _contentType : courseAssetObject.contentType,
        _contentTypeId : courseAssetObject.contentTypeId,
        _fieldName : courseAssetObject.fieldname,
        _assetId : courseAssetObject.assetId,
        _contentTypeParentId: courseAssetObject.contentTypeParentId
      }, {
        error: function(error) {
          Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorsaveasset') });
        },
        success: function() {
          self.saveModel(true);
        }
      });
    },

    removeCourseAsset: function (contentTypeId, contentType, fieldname) {
      var self = this;
      var courseAsset = this.findAsset(contentTypeId, contentType, fieldname);
      if (courseAsset) {
        courseAsset.destroy({
          success: function(success) {
            self.saveModel(true);
          }
        });
      } else {
        this.setValue('');
        this.saveModel(true);
      }
    },

    /**
    * event handlers
    */

    onAutofill: function(courseAssetObject, value) {
      this.value = value;
      this.createCourseAsset(courseAssetObject);
    },

    onAssetButtonClicked: function(e) {
      e && e.preventDefault();
      Origin.trigger('modal:open', AssetManagementModalView, {
        _shouldShowDoneButton: false,
        collection: new AssetCollection,
        assetType: this.schema.fieldType,
        onUpdate: this.onModalUpdate
      }, this);
    },

    onEditButtonClicked: function(e) {
      e && e.preventDefault();

      if('heroImage' === this.key) {
        var asset = new AssetModel({ _id: this.model.get('heroImage') });
      } else {
        var courseasset = this.findAsset(
          Origin.scaffold.getCurrentModel().get('_id'),
          Origin.scaffold.getCurrentModel().get('_type'),
          this.getValue() ? this.getValue().replace('course/assets/', '') : ''
        );
        var asset = new AssetModel({ _id: courseasset.get('_assetId') });
      }

      var self = this;    
      asset.fetch({
        success: function(model) {
          Origin.trigger('modal:open', ScaffoldAssetEditView, {
            _shouldRenderPopup: false,
            model: model,
            onUpdate: self.onModalUpdate
          }, self);
        },
        error: function() {
          Origin.Notify.alert({ type: 'error', text: window.polyglot.t('app.errorgeneric') });
        }
      });
    },

    onChangeButtonClicked: function(e) {
      e && e.preventDefault();
      if(Helpers.isAssetExternal(this.value)) {
        this.showFileUI(false);
        this.showInputUI(true);
      }
      else {
        this.onAssetButtonClicked(e);
      }
    },

    onClearButtonClicked: function(e) {
      e && e.preventDefault();

      this.setValue('');
      this.showInputUI();

      if(Helpers.isAssetExternal(this.value)) {
        this.saveModel(false);
      }
      else {
        if ('heroImage' === this.key){
          this.saveModel(false, { heroImage: this.getValue() });
          return;
        }

        var contentTypeId = Origin.scaffold.getCurrentModel().get('_id');
        var contentType = Origin.scaffold.getCurrentModel().get('_type');
        var fieldname = this.getValue() ? this.getValue().replace('course/assets/', '') : '';
        this.removeCourseAsset(contentTypeId, contentType, fieldname);
      }
    },

    onExternalAssetButtonClicked: function(e) {
      e && e.preventDefault();
      this.showInputUI();
    },

    onExternalAssetSaveClicked: function(e) {
      e && e.preventDefault();
      var inputValue = this.$('.scaffold-asset-external-input-field').val();
      // Check that there's actually some value
      if (inputValue.length > 0) {
        this.value = inputValue;
        this.saveModel(false);
      } else {
        // If nothing don't bother saving - instead revert to showing the buttons again
        this.showInputUI(false);
      }
    },

    onExternalAssetCancelClicked: function(e) {
      e && e.preventDefault();
      this.render();
    },

    onSaveSuccess: function() {
      this.render();
      this.trigger('change', this);
    },

    onModalUpdate: function(data) {
      if(!data) {
        return;
      }
      if ('heroImage' === this.key) {
        this.setValue(data.assetId);
        this.saveModel(false, { heroImage: data.assetId });
        return;
      }
      // Setup courseasset
      var parentId = Origin.scaffold.getCurrentModel().get('_parentId');
      var courseId = Origin.editor.data.course.get('_id');
      var courseAssetObject = {
        contentTypeId: Origin.scaffold.getCurrentModel().get('_id') || '',
        contentType: Origin.scaffold.getCurrentModel().get('_type'),
        contentTypeParentId: parentId || courseId,
        fieldname: data.assetFilename,
        assetId: data.assetId
      };
      // If the data is meant to autofill the rest of the graphic sizes
      // pass out an event instead - this is currently only used for the graphic component
      if (data._shouldAutofill) {
        return Origin.trigger('scaffold:assets:autofill', courseAssetObject, data.assetLink);
      }
      this.value = data.assetLink;
      this.createCourseAsset(courseAssetObject);
    }
  }, {
    template: "scaffoldAsset"
  });

  Origin.on('app:dataReady', function() {
    // Add Image editor to the list of editors
    Origin.scaffold.addCustomField('Asset:image', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:audio', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:video', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:other', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset', ScaffoldAssetView);
  })

  return ScaffoldAssetView;
});
