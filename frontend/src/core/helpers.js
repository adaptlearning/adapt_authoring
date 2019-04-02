// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var Handlebars = require('handlebars');
  var Origin = require('core/origin');
  var Moment = require('moment');

  var helpers = {
    console: function(context) {
      return console.log(context);
    },

    lowerCase: function(text) {
      return text.toLowerCase();
    },

    numbers: function(index) {
      return index+1;
    },

    capitalise:  function(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },

    odd: function (index) {
      return (index +1) % 2 === 0  ? 'even' : 'odd';
    },

    stringToClassName: function(text) {
      if (!text) return;
      // Check if first character is an underscore and remove
      // Normally used for attribute with '_'s
      if (text.slice(1) === '_') {
        text = text.slice(1);
      }
      // Remove _ and spaces with dashes
      return text.replace(/_| /g, "-").toLowerCase();
    },

    keyToTitleString: function(key) {
      if (!key) return;
      // check translatable strings first
      var l10nKey = 'app.scaffold.' + key;
      if(Origin.l10n.has(l10nKey)) {
        return Origin.l10n.t(l10nKey);
      }
      // fall-back: remove all _ and capitalise
      var string = key.replace(/_/g, '').replace(/[A-Z]/g, ' $&').toLowerCase();
      return this.capitalise(string);
    },

    momentFormat: function(date, format) {
      if (typeof date == 'undefined') {
        return '-';
      }
      return Moment(date).format(format);
    },

    formatDuration: function(duration) {
      var zero = '0', hh, mm, ss;
      var time = new Date(0, 0, 0, 0, 0, Math.floor(duration), 0);

      hh = time.getHours();
      mm = time.getMinutes();
      ss = time.getSeconds();

      // Pad zero values to 00
      hh = (zero+hh).slice(-2);
      mm = (zero+mm).slice(-2);
      ss = (zero+ss).slice(-2);

      return hh + ':' + mm + ':' + ss;
    },

    // checks for http/https and www. prefix
    isAssetExternal: function(url) {
      if (!url || !url.length) {
        return true;
      }
      var urlRegEx = new RegExp(/^(https?:\/\/)|^(www\.)/);
      return url.match(urlRegEx) !== null;
    },

    ifValueEquals: function(value, text, block) {
      return (value === text) ? block.fn(this) : block.inverse(this);
    },

    ifUserIsMe: function(userId, block) {
      var isMe = userId === Origin.sessionModel.get('id');
      return isMe ? block.fn(this) : block.inverse(this);
    },

    selected: function(option, value){
      return (option === value) ? ' selected' : '';
    },

    counterFromZero: function(n, block) {
      var sum = '';
      for (var i = 0; i <= n; ++i) sum += block.fn(i);
      return sum;
    },

    counterFromOne: function(n, block) {
      var sum = '';
      for (var i = 1; i <= n; ++i) sum += block.fn(i);
      return sum;
    },

    t: function(str, options) {
      for (var placeholder in options.hash) {
        options[placeholder] = options.hash[placeholder];
      }
      return Origin.l10n.t(str, options);
    },

    stripHtml: function(html) {
      return new Handlebars.SafeString(html);
    },

    bytesToSize: function(bytes) {
      if (bytes === 0) return '0 B';

      var k = 1000;
      var sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));

      return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    },

    renderBooleanOptions: function(selectedValue) {
      var options = ["true", "false"];
      var html = '';

      for (var i = 0; i < options.length; i++) {
        var selected = selectedValue == options[i] ? ' selected' : '';
        html += '<option value="' + options[i] + '"' + selected + '>' + options[i] + '</option>';
      }
      return new Handlebars.SafeString(html);
    },

    pickCSV: function(list, key, separator) {
      if (!list || !list.length) {
        return '';
      }
      if (!separator || !separator.length) {
        separator = ',';
      }
      var vals = [];
      for (var i = 0, l = list.length; i < l; i++) {
        var val = list[i];
        var nestedVal = key && val[key];
        vals.push(nestedVal || val);
      }
      return vals.join(separator);
    },

    renderTags: function(list, key) {
      if (!list || !list.length) {
        return '';
      }
      var html = '<ul class="tag-container">';
      for (var i = 0; i < list.length; ++i) {
        var item = list[i];
        var tag = Handlebars.Utils.escapeExpression(key && item[key] || item);
        html += '<li class="tag-item" title="' + tag + '"><span class="tag-value">' + tag  + '</span></li>';
      }
      return new Handlebars.SafeString(html + '</ul>');
    },

    decodeHTML: function(html) {
      var el = document.createElement('div');
      el.innerHTML = html;
      return el.childNodes.length === 0 ? "" : el.childNodes[0].nodeValue;
    },

    ifHasPermissions: function(permissions, block) {
      var hasPermission = Origin.permissions.hasPermissions(permissions.split(','));
      return hasPermission ? block.fn(this) : block.inverse(this);
    },

    ifMailEnabled: function(block) {
      return Origin.constants.useSmtp === true ? block.fn(this) : block.inverse(this);
    },

    ifImageIsCourseAsset: function(url, block) {
      var isCourseAsset = url.length !== 0 && url.indexOf('course/assets') === 0;
      return isCourseAsset ? block.fn(this) : block.inverse(this);
    },

    ifAssetIsExternal: function(url, block) {
      var isExternal = Handlebars.helpers.isAssetExternal(url);
      return isExternal ? block.fn(this) : block.inverse(this);
    },

    ifAssetIsHeroImage: function(url, block) {
      var isMultiPart = url.split('/').length === 1;
      return isMultiPart ? block.fn(this) : block.inverse(this);
    },

    copyStringToClipboard: function(data) {
      var textArea = document.createElement("textarea");

      textArea.value = data;
      // Place in top-left corner of screen regardless of scroll position.
      textArea.style.position = 'fixed';
      textArea.style.top = 0;
      textArea.style.left = 0;
      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = 0;
      // Clean up any borders.
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      // Avoid flash of white box if rendered for any reason.
      textArea.style.background = 'transparent';

      document.body.appendChild(textArea);

      textArea.select();

      var success = document.execCommand('copy');

      document.body.removeChild(textArea);

      return success;
    },

    // checks for at least one child object
    validateCourseContent: function(currentCourse, callback) {
      var containsAtLeastOneChild = true;
      var alerts = [];
      var iterateOverChildren = function(model, index, doneIterator) {
        if(!model._childTypes) {
          return doneIterator();
        }
        model.fetchChildren(function(currentChildren) {
          if (currentChildren.length > 0) {
            return helpers.forParallelAsync(currentChildren, iterateOverChildren, doneIterator);
          }
          containsAtLeastOneChild = false;
          var children = _.isArray(model._childTypes) ? model._childTypes.join('/') : model._childTypes;
          alerts.push(model.get('_type') + " '" + model.get('title') + "' missing " + children);
          doneIterator();
        });
      };
      // start recursion
      iterateOverChildren(currentCourse, null, function() {
        var errorMessage = "";
        if(alerts.length > 0)  {
          for(var i = 0, len = alerts.length; i < len; i++) {
            errorMessage += "<li>" + alerts[i] + "</li>";
          }
          return callback(new Error(errorMessage));
        }
        callback(null, true);
      });
    },

    isValidEmail: function(value) {
      var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return value.length > 0 && regEx.test(value);
    },

    contentModelMap: function(type) {
      var contentModels = {
        course: 'core/models/courseModel',
        contentobject: 'core/models/contentObjectModel',
        article: 'core/models/articleModel',
        block: 'core/models/blockModel',
        component: 'core/models/componentModel',
        courseasset: 'core/models/courseAssetModel'
      };
      if(contentModels.hasOwnProperty(type)) {
        return require(contentModels[type]);
      }
    },

    /**
    * Ensures list is iterated (doesn't guarantee order), even if using async iterator
    * @param list Array or Backbone.Collection
    * @param func Function to use as iterator. Will be passed item, index and callback function
    * @param callback Function to be called on completion
    */
    forParallelAsync: function(list, func, callback) {
      if(!list.hasOwnProperty('length') || list.length === 0) {
        if(typeof callback === 'function') callback();
        return;
      }
      // make a copy in case func modifies the original
      var listCopy = list.models ? list.models.slice() : list.slice();
      var doneCount = 0;
      var _checkCompletion = function() {
        if((++doneCount === listCopy.length) && typeof callback === 'function') {
          callback();
        }
      };
      for(var i = 0, count = listCopy.length; i < count; i++) {
        func(listCopy[i], i, _checkCompletion);
      }
    },

    /**
    * Does a fetch for model in models, and returns the latest data in the
    * passed callback
    * @param models {Array of Backbone.Models}
    * @param callback {Function to call when complete}
    */
    multiModelFetch: function(models, callback) {
      var collatedData = {};
      helpers.forParallelAsync(models, function(model, index, done) {
        model.fetch({
          success: function(data) {
            collatedData[index] = data;
            done();
          },
          error: function(data) {
            console.error('Failed to fetch data for', model.get('_id'), + data.responseText);
            done();
          }
        });
      }, function doneAll() {
        var orderedKeys = Object.keys(collatedData).sort();
        var returnArr = [];
        for(var i = 0, count = orderedKeys.length; i < count; i++) {
          returnArr.push(collatedData[orderedKeys[i]]);
        }
        callback(returnArr);
      });
    },

    maxUploadSize: function(options) {
      return new Handlebars.SafeString([
        '<span class="max-fileupload-size">',
        Origin.l10n.t('app.maxfileuploadsize', {size: Origin.constants.humanMaxFileUploadSize}),
        '</span>'].join(''))
    }
  };

  for(var name in helpers) {
    if(!helpers.hasOwnProperty(name)) {
      continue;
    }
    Handlebars.registerHelper(name, helpers[name]);
  }

  return helpers;
});
