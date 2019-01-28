define([ 'core/origin', 'backbone-forms' ], function(Origin, BackboneForms) {

  var ScaffoldTagsView = Backbone.Form.editors.Base.extend({

    tagName: 'input',

    className: 'scaffold-tags',

    events: {
      'change': function() { this.trigger('change', this); },
      'focus': function() { this.trigger('focus', this); },
      'blur': function() { this.trigger('blur', this); }
    },

    render: function() {
      this.setValue(this.value);
      _.defer(this.postRender.bind(this));

      return this;
    },

    postRender: function() {
      this.$el.selectize({
        create: true,
        labelField: 'title',
        load: function(query, callback) {
          $.ajax({
            url: '/api/autocomplete/tag',
            method: 'GET',
            error: callback,
            success: callback
          });
        },
        onItemAdd: this.onAddTag.bind(this),
        onItemRemove: this.onRemoveTag.bind(this),
        searchField: [ 'title' ]
      });
    },

    getValue: function() {
      return this.model.get('tags');
    },

    setValue: function(value) {
      this.$el.val(_.pluck(value, 'title').join());
    },

    focus: function() {
      if (!this.hasFocus) {
        this.$el.focus();
      }
    },

    blur: function() {
      if (this.hasFocus) {
        this.$el.blur();
      }
    },

    onAddTag: function(value) {
      $.ajax({
        url: '/api/content/tag',
        method: 'POST',
        data: { title: value }
      }).done(function(data) {
        var id = data && data._id;

        if (!id) return;

        var tags = this.model.get('tags');

        tags.push({ _id: id, title: data.title });
        this.model.set('tags', tags);
      }.bind(this));
    },

    onRemoveTag: function(value) {
      var tags = this.model.get('tags').filter(function(tag) {
        return tag.title !== value;
      });

      this.model.set('tags', tags);
    }
  });

  Origin.on('origin:dataReady', function() {
    Origin.scaffold.addCustomField('Tags', ScaffoldTagsView);
  });

  return ScaffoldTagsView;

});
