// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  var Origin = require('core/origin');
  var ContentObjectModel = require('core/models/contentObjectModel');
  var ArticleModel = require('core/models/articleModel');
  var BlockModel = require('core/models/blockModel');
  var ComponentModel = require('core/models/componentModel');
  var ComponentTypeModel = require('core/models/componentTypeModel');
  var EditorOriginView = require('../../global/views/editorOriginView');
  var EditorCollection = require('../../global/collections/editorCollection');

  var EditorCourseEditView = EditorOriginView.extend({
    className: "course-edit",
    tagName: "div",

    preRender: function() {
      this.listenTo(Origin, 'projectEditSidebar:views:save', this.save);

      if (this.model.isNew()) {
        this.isNew = true;
        this.$el.addClass('project-detail-hide-hero');
        // Initialise the 'tags' property for a new course
        this.model.set('tags', []);
      }
      // This next line is important for a proper PATCH request on saveProject()
      this.originalAttributes = _.clone(this.model.attributes);
    },

    getAttributesToSave: function() {
      this.model.set('tags', _.pluck(this.model.get('tags'), '_id'));

      var changedAttributes = this.model.changedAttributes(this.originalAttributes);
      if(changedAttributes) {
        return _.pick(this.model.attributes, _.keys(changedAttributes));
      }
      return null;
    },

    onSaveSuccess: function(model, response, options) {
      if(!this.isNew) {
        EditorOriginView.prototype.onSaveSuccess.apply(this, arguments);
        return;
      }
      this.populateNewCourse(model);
    },

    // FIXME not really  good enough to handle model save errors and other errors here
    onSaveError: function(model, response, options) {
      if(arguments.length === 2) {
        EditorOriginView.prototype.onSaveError.apply(this, arguments);
        return;
      }
      var messageText = typeof response.responseJSON == 'object' && response.responseJSON.message;
      EditorOriginView.prototype.onSaveError.call(this, null, messageText);
    },

    /**
     * When a new course is created it gets populated with a page, article, block and text component
     * so that it can be previewed immediately.
     * @param model
     */
    populateNewCourse: function(model) {
      this.createGenericPage(model);
    },

    createGenericPage: function(courseModel) {
      var contentObjectModel = new ContentObjectModel({
        title: Origin.l10n.t('app.placeholdernewpage'),
        displayTitle: Origin.l10n.t('app.placeholdernewpage'),
        _type: 'page',
        _courseId: courseModel.get('_id'),
        _parentId: courseModel.get('_id')
      });
      contentObjectModel.save(null, {
        error: _.bind(this.onSaveError, this),
        success: _.bind(this.createGenericArticle, this)
      });
    },

    createGenericArticle: function(pageModel) {
      var articleModel = new ArticleModel({
        _courseId: pageModel.get('_courseId'),
        _parentId: pageModel.get('_id'),
        _type: 'article'
      });
      articleModel.save(null, {
        error: _.bind(this.onSaveError, this),
        success: _.bind(this.createGenericBlock, this)
      });
    },

    createGenericBlock: function(articleModel) {
      var blockModel = new BlockModel({
        _courseId: articleModel.get('_courseId'),
        _parentId: articleModel.get('_id'),
        _type: 'block',
        layoutOptions: [
          { type: 'left', name: 'app.layoutleft', pasteZoneRenderOrder: 2 },
          { type: 'full', name: 'app.layoutfull', pasteZoneRenderOrder: 1 },
          { type: 'right', name: 'app.layoutright', pasteZoneRenderOrder: 3 }
        ]
      });
      blockModel.save(null, {
        error: _.bind(this.onSaveError, this),
        success: _.bind(this.createGenericComponent, this)
      });
    },

    createGenericComponent: function(blockModel) {
      // Store the component types
      var componentTypes = new EditorCollection(null, {
        model: ComponentTypeModel,
        url: '/api/componenttype',
        _type: 'componentTypes'
      });
      componentTypes.fetch({
        error: _.bind(this.onSaveError, this),
        success: _.bind(function() {
          var componentModel = new ComponentModel({
            _courseId: blockModel.get('_courseId'),
            _parentId: blockModel.get('_id'),
            body: Origin.l10n.t('app.projectcontentbody'),
            _type: 'component',
            _component: 'text',
            _componentType: componentTypes.findWhere({ component: 'text' }).attributes._id,
            _layout: 'full'
          });
          componentModel.save(null, {
            error: _.bind(this.onSaveError, this),
            success: function() {
              Origin.router.navigateTo('/editor/' + componentModel.get('_courseId') + '/menu');
            }
          });
        }, this)
      });
    }
  }, {
    template: 'editorCourseEdit'
  });

  return EditorCourseEditView;
});
