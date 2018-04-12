// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Backbone = require('backbone');
  var BackboneForms = require('backbone-forms');
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');
  var AssetManagementModalView = require('modules/assetManagement/views/assetManagementModalView');
  var AssetCollection = require('modules/assetManagement/collections/assetCollection');
  var ContentCollection = require('core/collections/contentCollection');
  var CourseAssetModel = require('core/models/courseAssetModel');

  var ScaffoldAssetView = Backbone.Form.editors.Base.extend({
    tagName: 'div',
    events: {
      // triggered whenever something happens that affects the result of `this.getValue()`
      'change input': function() {
        this.toggleFieldAvailibility();
        this.trigger('change', this);
      },
      // triggered whenever an input in this editor becomes the `document.activeElement`
      'focus input': function() {
        this.trigger('focus', this);
      },
      // triggered whenever an input in this editor stops being the `document.activeElement`
      'blur input': function() {
        this.trigger('blur', this);
      },
      'click .scaffold-asset-picker': 'onAssetButtonClicked',
      'click .scaffold-asset-external': 'onExternalAssetButtonClicked',
      'click .scaffold-asset-clear': 'onClearButtonClicked',
      'click .scaffold-asset-external-input-save': 'onExternalAssetSaveClicked',
      'click .scaffold-asset-external-input-cancel': 'onExternalAssetCancelClicked',
    },

    initialize: function(options) {
      this.listenTo(Origin, 'scaffold:assets:autofill', this.onAutofill);
      Backbone.Form.editors.Base.prototype.initialize.call(this, options);
    },

    render: function() {
      var template = Handlebars.templates[this.constructor.template];
      var templateData = {
        value: this.value,
        type: this.schema.fieldType.replace('Asset:', '')
      };
      // this delgate function is async, so does a re-render once the data is loaded
      var _renderDelegate = _.bind(function(assetId) {
        if(assetId) {
          templateData.url = '/api/asset/serve/' + assetId;
          templateData.thumbUrl = '/api/asset/thumb/' + assetId;
          this.$el.html(template(templateData));
        }
      }, this);
      if(Helpers.isAssetExternal(this.value)) {
        // we know there won't be a courseasset record, so don't bother fetching
        templateData.url = this.value;
        templateData.thumbUrl = this.value;
      } else {
        // don't have asset ID, so query courseassets for matching URL && content ID
        this.fetchCourseAsset({
          _fieldName: this.value.split('/').pop(),
          _contentTypeId: Origin.scaffold.getCurrentModel().get('_id')
        }, function(error, collection) {
          if(error) {
            console.error(error);
            return _renderDelegate();
          }
          if(collection.length === 0) {
            return _renderDelegate();
          }
          _renderDelegate(collection.at(0).get('_assetId'));
        });
      }
      // we do a first pass render here to satisfy code expecting us to return 'this'
      this.setValue(this.value);
      this.toggleFieldAvailibility();
      this.$el.html(template(templateData));
      return this;
    },

    getValue: function() {
      return this.value || '';
    },

    setValue: function(value) {
      this.value = value;
    },

    toggleFieldAvailibility: function() {
      this.$('input').attr('disabled', this.getValue().length === 0);
    },

    checkValueHasChanged: function() {
      var val = this.getValue();
      if ('heroImage' === this.key) {
        this.saveModel({ heroImage: val });
        return;
      }
      if(Helpers.isAssetExternal(val)) {
        this.saveModel();
        return;
      }
      var contentTypeId = Origin.scaffold.getCurrentModel().get('_id');
      var contentType = Origin.scaffold.getCurrentModel().get('_type');
      var fieldname = val.replace('course/assets/', '');
      this.removeCourseAsset(contentTypeId, contentType, fieldname);
    },

    createCourseAsset: function(courseAssetObject) {
      (new CourseAssetModel()).save({
        _courseId : Origin.editor.data.course.get('_id'),
        _contentType : courseAssetObject.contentType,
        _contentTypeId : courseAssetObject.contentTypeId,
        _fieldName : courseAssetObject.fieldname,
        _assetId : courseAssetObject.assetId,
        _contentTypeParentId: courseAssetObject.contentTypeParentId
      }, {
        success: _.bind(function() {
          this.saveModel();
        }, this),
        error: function(error) {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorsaveasset')
          });
        }
      });
    },

    fetchCourseAsset: function(searchCriteria, cb) {
      if(!searchCriteria._contentTypeId) {
        searchCriteria._contentTypeParentId = Origin.editor.data.course.get('_id');
      }
      (new ContentCollection(null, { _type: 'courseasset' })).fetch({
        data: searchCriteria,
        success: function(collection) {
          cb(null, collection);
        },
        error: function(model, response) {
          cb('Failed to fetch data for', model.get('filename') + ':', response.statusText);
        }
      });
    },

    removeCourseAsset: function(contentTypeId, contentType, fieldname) {
      this.fetchCourseAsset({
        _contentTypeId: contentTypeId,
        _contentType: contentType,
        _fieldName: fieldname
      }, _.bind(function(error, courseassets) {
        if(error) {
          return console.error(error);
        }
        if(courseassets.length === 0) {
          this.setValue('');
          this.saveModel();
          return;
        }
        // delete all matching courseassets and then saveModel
        Helpers.forParallelAsync(courseassets, function(model, index, cb) {
          model.destroy({
            success: cb,
            error: function(error) {
              console.error('Failed to destroy courseasset record', courseasset.get('_id'));
              cb();
            }
          });
        }, _.bind(this.saveModel, this));
      }, this));
    },

    saveModel: function(attributesToSave) {
      var isUsingAlternativeModel = false;
      var currentModel = Origin.scaffold.getCurrentModel();
      var alternativeModel = Origin.scaffold.getAlternativeModel();
      var alternativeAttribute = Origin.scaffold.getAlternativeAttribute();
      // Check if alternative model should be used
      if (alternativeModel) {
        currentModel = alternativeModel;
        isUsingAlternativeModel = true;
      }
      // run schema validation
      Origin.scaffold.getCurrentForm().commit({ validate: false });
      // Check if alternative attribute should be used
      if (alternativeAttribute) {
        attributesToSave[alternativeAttribute] = Origin.scaffold.getCurrentModel().attributes;
      }
      if (!attributesToSave) {
        currentModel.pruneAttributes();
        currentModel.unset('tags');
      }
      currentModel.save(attributesToSave, {
        patch: attributesToSave !== undefined,
        success: _.bind(function() {
          this.render();
          this.trigger('change', this);
        }, this),
        error: function() {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorsaveasset')
          });
        }
      });
    },

    /**
    * Event handling
    */

    focus: function() {
      if (this.hasFocus) return;
      /**
      * makes input the `document.activeElement`, triggering this editor's
      * focus` event, and setting `this.hasFocus` to `true`.
      * See this.events above for more detail
      */
      this.$('input').focus();
    },

    blur: function() {
      if(this.hasFocus) this.$('input').blur();
    },

    onAssetButtonClicked: function(event) {
      event.preventDefault();
      Origin.trigger('modal:open', AssetManagementModalView, {
        collection: new AssetCollection,
        assetType: this.schema.fieldType,
        _shouldShowScrollbar: false,
        onUpdate: function(data) {
          if (!data) {
            return;
          }
          if ('heroImage' === this.key) {
            this.setValue(data.assetId);
            this.saveModel({ heroImage: data.assetId });
            return;
          }
          var courseAssetObject = {
            contentTypeId: Origin.scaffold.getCurrentModel().get('_id') || '',
            contentType: Origin.scaffold.getCurrentModel().get('_type'),
            contentTypeParentId: Origin.scaffold.getCurrentModel().get('_parentId') || Origin.editor.data.course.get('_id'),
            fieldname: data.assetFilename,
            assetId: data.assetId
          };
          // all ScaffoldAssetViews listen to the autofill event, so we trigger
          // that rather than call code directly
          // FIXME only works with graphic components
          if (data._shouldAutofill) {
            Origin.trigger('scaffold:assets:autofill', courseAssetObject, data.assetLink);
            return;
          }
          this.value = data.assetLink;
          this.createCourseAsset(courseAssetObject);
        }
      }, this);
    },

    onClearButtonClicked: function(event) {
      event.preventDefault();
      this.checkValueHasChanged();
      this.setValue('');
      this.toggleFieldAvailibility();
    },

    onAutofill: function(courseAssetObject, value) {
      this.value = value;
      this.createCourseAsset(courseAssetObject);
    },

    onExternalAssetButtonClicked: function(event) {
      event.preventDefault();
      this.$('.scaffold-asset-external-input').removeClass('display-none');
      this.$('.scaffold-asset-buttons').addClass('display-none');
    },

    onExternalAssetSaveClicked: function(event) {
      event.preventDefault();
      var inputValue = this.$('.scaffold-asset-external-input-field').val();

      if (inputValue.length === 0) { // nothing to save
        this.$('.scaffold-asset-external-input').addClass('display-none');
        this.$('.scaffold-asset-buttons').removeClass('display-none');
        return;
      }
      this.setValue(inputValue);
      this.saveModel();
    },

    onExternalAssetCancelClicked: function(event) {
      event.preventDefault();
      this.$('.scaffold-asset-external-input').addClass('display-none');
      this.$('.scaffold-asset-buttons').removeClass('display-none');
    },
  }, {
    template: "scaffoldAsset"
  });

  Origin.on('origin:dataReady', function() {
    // Add Image editor to the list of editors
    Origin.scaffold.addCustomField('Asset:image', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:audio', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:video', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset:other', ScaffoldAssetView);
    Origin.scaffold.addCustomField('Asset', ScaffoldAssetView);
  });

  return ScaffoldAssetView;
});
