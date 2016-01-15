// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/*
* BuilderView - base class for all views
* License - http://github.com/adaptlearning/adapt_authoring/LICENSE
* Maintainers - Brian Quinn <brian@learningpool.com>
*/
define(function(require){

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var OriginView = Backbone.View.extend({

    settings: {
      autoRender: true,
      preferencesKey: ''
    },

    initialize: function(options) {
      this.preRender(options);
      if (this.constructor.template) {
        Origin.trigger(this.constructor.template + ':preRender', this);
      }
      if (this.settings.autoRender) {
        this.render();
      }
      this.listenTo(Origin, 'remove:views', this.remove);
    },

    preRender: function() {},

    render: function() {
      var data = this.model ? this.model.toJSON() : null;
      var template = Handlebars.templates[this.constructor.template];
      this.$el.html(template(data));
      _.defer(_.bind(function() {
        this.postRender();
        this.onReady();
        if (this.constructor.template) {
          Origin.trigger(this.constructor.template + ':postRender', this);
        }
      }, this));
      return this;
    },

    postRender: function() {},

    onReady: function() {},

    setViewToReady: function() {
      Origin.trigger('router:hideLoading');
    },

    setUserPreference: function(key, value) {
      if (this.settings.preferencesKey && typeof(Storage) !== "undefined") {
        // Get preferences for this view
        var preferences = (Origin.sessionModel.get(this.settings.preferencesKey) || {});
        // Set key and value
        preferences[key] = value;
        // Store in localStorage
        Origin.sessionModel.set(this.settings.preferencesKey, preferences);
        
      }
    },

    getUserPreferences: function() {
      if (this.settings.preferencesKey && typeof(Storage) !== "undefined"
        && localStorage.getItem(this.settings.preferencesKey)) {
        return Origin.sessionModel.get(this.settings.preferencesKey);
      } else {
        return {};
      }
    },

    sortArrayByKey: function (arr, key) {
      return arr.sort(function(a, b){
        var keyA = a[key],
        keyB = b[key];
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
      });
    },

    remove: function() {
    
     
      // If a view has a form - remove it when removing parent view
      if (this.form) {

        // remove ckeditor instances
        this.form.$( "textarea" ).each(function () {
          var editor = CKEDITOR.instances[this.id];
          try {
            // check editor is still in the dom (otherwise throws exception)
            if (editor && editor.window.getFrame()){
              editor.destroy(true);
            } 
          } catch (e) {
          }
        });

        this.form.remove();
      } 
        // Call original remove
      Backbone.View.prototype.remove.apply(this, arguments);
     
     

    }

  });

  return OriginView;

});
