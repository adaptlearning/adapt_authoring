// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {

    var Backbone = require('backbone');
    var BackboneForms = require('backboneForms');
    var Origin = require('coreJS/app/origin');
    var AssetManagementModalView = require('coreJS/assetManagement/views/assetManagementModalView');
    var AssetCollection = require('coreJS/assetManagement/collections/assetCollection');
    var EditorCourseAssetModel = require('editorCourse/models/editorCourseAssetModel');
    
    var ScaffoldAssetView = Backbone.Form.editors.Base.extend({

        tagName: 'div',

        events: {
            'change input': function() {
                // The 'change' event should be triggered whenever something happens
                // that affects the result of `this.getValue()`.
                this.toggleFieldAvailibility();
                //this.checkValueHasChanged();
                this.trigger('change', this);
            },
            'focus input': function() {
                // The 'focus' event should be triggered whenever an input within
                // this editor becomes the `document.activeElement`.
                this.trigger('focus', this);
                // This call automatically sets `this.hasFocus` to `true`.
            },
            'blur input': function() {
                // The 'blur' event should be triggered whenever an input within
                // this editor stops being the `document.activeElement`.
                this.trigger('blur', this);
                // This call automatically sets `this.hasFocus` to `false`.
            },
            'click .scaffold-asset-picker': 'onAssetButtonClicked',
            'click .scaffold-asset-external': 'onExternalAssetButtonClicked',
            'click .scaffold-asset-clear': 'onClearButtonClicked',
            'click .scaffold-asset-external-input-save': 'onExternalAssetSaveClicked',
            'click .scaffold-asset-external-input-cancel': 'onExternalAssetCancelClicked',
            'click .scaffold-asset-clear-external': 'onExternalClearButtonClicked'

        },

        initialize: function(options) {
            this.listenTo(Origin, 'scaffold:assets:autofill', this.onAutofill);
            // Call parent constructor
            Backbone.Form.editors.Base.prototype.initialize.call(this, options);
            
        },

        onAutofill: function(courseAssetObject, value) {
            this.value = value;
            this.createCourseAsset(courseAssetObject);
        },

        render: function() {
            var assetType = this.schema.fieldType.replace('Asset:', '');
            this.$el.html(Handlebars.templates[this.constructor.template]({value: this.value, type: assetType}));
            this.setValue(this.value);
            // Should see if the field contains anything on render
            // if so disable it
            this.toggleFieldAvailibility();

            return this;
        },

        getValue: function() {
            return this.value || '';
            //return this.$('input').val();
        },

        setValue: function(value) {
            this.value = value;
            //this.$('input').val(value);
        },

        focus: function() {
            if (this.hasFocus) return;

            // This method call should result in an input within this edior
            // becoming the `document.activeElement`.
            // This, in turn, should result in this editor's `focus` event
            // being triggered, setting `this.hasFocus` to `true`.
            // See above for more detail.
            this.$('input').focus();
        },

        blur: function() {
            if (!this.hasFocus) return;

            this.$('input').blur();
        },

        toggleFieldAvailibility: function() {
            if (this.getValue().length === 0) {
                this.$('input').attr('disabled', false);
                //this.$('.scaffold-asset-clear').addClass('display-none');
            } else {
                //this.$('.scaffold-asset-clear').removeClass('display-none');
                this.$('input').attr('disabled', true);
            }
        },

        checkValueHasChanged: function() {
            if ('heroImage' === this.key){
                this.saveModel(false, {heroImage: this.getValue()});
                return;
            }
            var contentTypeId = Origin.scaffold.getCurrentModel().get('_id');
            var contentType = Origin.scaffold.getCurrentModel().get('_type');
            var fieldname = this.getValue() ? this.getValue().replace('course/assets/', '') : '';
            this.removeCourseAsset(contentTypeId, contentType, fieldname);
        },

        onExternalAssetButtonClicked: function(event) {
            event.preventDefault();
            this.$('.scaffold-asset-external-input').removeClass('display-none');
            this.$('.scaffold-asset-buttons').addClass('display-none');
        },

        onExternalAssetSaveClicked: function(event) {
            event.preventDefault();
            var inputValue = this.$('.scaffold-asset-external-input-field').val();
            // Check that there's actually some value
            if (inputValue.length > 0) {
                this.value = inputValue;
                this.saveModel(false);
            } else {
                // If nothing don't bother saving - instead revert to showing the buttons again
                this.$('.scaffold-asset-external-input').addClass('display-none');
                this.$('.scaffold-asset-buttons').removeClass('display-none');
            }
        },

        onExternalAssetCancelClicked: function(event) {
            event.preventDefault();
            this.$('.scaffold-asset-external-input').addClass('display-none');
            this.$('.scaffold-asset-buttons').removeClass('display-none');
        },

        onAssetButtonClicked: function(event) {
            event.preventDefault();
            Origin.trigger('modal:open', AssetManagementModalView, {
                collection: new AssetCollection,
                assetType: this.schema.fieldType,
                onUpdate: function(data) {
                    if (data) {

                        if ('heroImage' === this.key){
                            this.setValue(data.assetId);
                            this.saveModel(false, {heroImage: data.assetId});
                            return;
                        }
                        // Setup courseasset
                        var contentTypeId = Origin.scaffold.getCurrentModel().get('_id') || '';
                        var contentType = Origin.scaffold.getCurrentModel().get('_type');
                        var contentTypeParentId = Origin.scaffold.getCurrentModel().get('_parentId') || Origin.editor.data.course.get('_id');
                        var fieldname = data.assetFilename;
                        var assetId = data.assetId;

                        
                        var courseAssetObject = {
                            contentTypeId: contentTypeId,
                            contentType: contentType,
                            contentTypeParentId: contentTypeParentId,
                            fieldname: fieldname,
                            assetId: assetId
                        }

                        // If the data is meant to autofill the rest of the graphic sizes
                        // pass out an event instead - this is currently only used for the graphic component
                        if (data._shouldAutofill) {
                            Origin.trigger('scaffold:assets:autofill', courseAssetObject, data.assetLink);
                            return;
                        }

                        this.value = data.assetLink;

                        this.createCourseAsset(courseAssetObject);

                    }
                },
                onCancel: function(data) {
                    // console.log('cancelled', data);
                }
            }, this);
        },

        onClearButtonClicked: function(event) {
            event.preventDefault();            
            this.checkValueHasChanged();
            this.setValue('');
            this.toggleFieldAvailibility();
        },

        onExternalClearButtonClicked: function(event) {
            event.preventDefault();
            this.setValue('');
            this.saveModel(false);
            this.toggleFieldAvailibility();
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

            if (!asset) {
                // HACK - Try relaxing the search criteria for historic data
                asset = Origin.editor.data.courseAssets.findWhere({_contentType: contentType, _fieldName: fieldname});
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
            },{
                error: function(error) {
                    Origin.Notify.alert({
                        type: 'error',
                        text: window.polyglot.t('app.errorsaveasset')
                    });
                }, 
                success: function() {
                    self.saveModel(true);
                }
            });

        },

        removeCourseAsset: function (contentTypeId, contentType, fieldname) {
            var that = this;
            var courseAsset = this.findAsset(contentTypeId, contentType, fieldname);
            if (courseAsset) {
                courseAsset.destroy({
                    success: function(success) {
                        that.saveModel(true);
                    },
                    error: function(error) {
                    }
                });
            } else {
                this.setValue('');
                this.saveModel(true);
            }
        },

        saveModel: function(shouldResetAssetCollection, attributesToSave) {
            var that = this;
            var isUsingAlternativeModel = false;
            var currentModel = Origin.scaffold.getCurrentModel()
            var alternativeModel = Origin.scaffold.getAlternativeModel();
            var alternativeAttribute = Origin.scaffold.getAlternativeAttribute();
            var isPatch = false;
            
            attributesToSave = typeof attributesToSave == 'undefined' 
              ? []
              : attributesToSave;
              
            // Check if alternative model should be used
            if (alternativeModel) {
                currentModel = alternativeModel;
                isUsingAlternativeModel = true;
            }

            var currentForm = Origin.scaffold.getCurrentForm();
            var errors = currentForm.commit({validate: false});

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
                    Origin.Notify.alert({
                        type: 'error',
                        text: window.polyglot.t('app.errorsaveasset')
                    });
                },
                success: function() {
                    
                    // Sometimes we don't need to reset the courseAssets
                    if (shouldResetAssetCollection) {

                        Origin.editor.data.courseAssets.fetch({
                            reset:true, 
                            success: function() {
                                that.render();
                                that.trigger('change', that);
                            }
                        });

                    } else {
                        that.render();
                        that.trigger('change', that);
                    }
                }
            })
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

})