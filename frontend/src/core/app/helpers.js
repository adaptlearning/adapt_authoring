// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
    var Handlebars = require('handlebars');
    var Origin = require('coreJS/app/origin');
    var moment = require('moment');

    var helpers = {
      bytesToSize: bytesToSize,
      capitalise: capitalise,
      console: console,
      copyStringToClipboard: copyStringToClipboard,
      counterFromOne: counterFromOne,
      counterFromZero: counterFromZero,
      decodeHTML: decodeHTML,
      formatDate: formatDate,
      formatDuration: formatDuration,
      getAssetFromValue: getAssetFromValue,
      getThumbnailFromValue: getThumbnailFromValue,
      ifAssetIsExternal: ifAssetIsExternal,
      ifAssetIsHeroImage: ifAssetIsHeroImage,
      ifHasPermissions: ifHasPermissions,
      ifImageIsCourseAsset: ifImageIsCourseAsset,
      ifUserIsMe: ifUserIsMe,
      ifValueEquals: ifValueEquals,
      isAssetExternal: isAssetExternal,
      keyToTitleString: keyToTitleString,
      lowerCase: lowerCase,
      momentFormat: momentFormat,
      numbers: numbers,
      odd: odd,
      pickCSV: pickCSV,
      renderBooleanOptions: renderBooleanOptions,
      renderTags: renderTags,
      selected: selected,
      stringToClassName: stringToClassName,
      stripHtml: stripHtml,
      t: t,
      validateCourseConfirm: validateCourseConfirm,
      validateCourseContent: validateCourseContent
    };

    function bytesToSize(bytes) {
        if (bytes == 0) return '0 B';

        var k = 1000,
          sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
          i = Math.floor(Math.log(bytes) / Math.log(k));

        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    };

    function capitalise(text) {
      return text.charAt(0).toUpperCase() + text.slice(1);
    };

    function console(context) {
      return console.log(context);
    };

    function copyStringToClipboard(data) {
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
    };

    function counterFromOne(n, block) {
        var sum = '';
        for (var i = 1; i <= n; ++i)
            sum += block.fn(i);
        return sum;
    };

    function counterFromZero(n, block) {
        var sum = '';
        for (var i = 0; i <= n; ++i)
            sum += block.fn(i);
        return sum;
    };

    function decodeHTML(html) {
      var el = document.createElement('div');
      el.innerHTML = html;
      return el.childNodes.length === 0 ? "" : el.childNodes[0].nodeValue;
    };

    function formatDate(timestamp, noZero) {
      var noDisplay = '-';
      // 2014-02-17T17:00:34.196Z
      if (typeof(timestamp) !== 'undefined') {
        var date = new Date(timestamp);
        // optionally use noDisplay char if 0 dates are to be interpreted as such
        if (noZero && 0 === date.valueOf()) {
          return noDisplay;
        }
        return date.toDateString();
      }
      return noDisplay;
    };

    function formatDuration(duration) {
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
    };

    function getAssetFromValue(url) {
      var urlSplit = url.split('/');
      var fileName = urlSplit[urlSplit.length - 1];
      // Get courseAsset model
      var courseAsset = Origin.editor.data.courseAssets.findWhere({_fieldName: fileName});

      if (courseAsset) {
        var courseAssetId = courseAsset.get('_assetId');

        return '/api/asset/serve/' + courseAssetId;
      } else {
        return '';
      }
    };

    function getThumbnailFromValue(url) {
      var urlSplit = url.split('/');
      var fileName = urlSplit[urlSplit.length - 1];
      // Get courseAsset model
      var courseAsset = Origin.editor.data.courseAssets.findWhere({_fieldName: fileName});
      if (courseAsset) {
        var courseAssetId = courseAsset.get('_assetId');
        return '/api/asset/thumb/' + courseAssetId;
      } else {
        return '/api/asset/thumb/' + url;
      }
    };

    function ifAssetIsExternal(url, block) {
      if(Handlebars.helpers.isAssetExternal(url)) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    };

    function ifAssetIsHeroImage(url, block) {
      var urlSplit = url.split('/')
      if (urlSplit.length === 1) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    };

    function ifHasPermissions(permissions, block) {
      var permissionsArray = permissions.split(',');
      if (Origin.permissions.hasPermissions(permissionsArray)) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    };

    function ifImageIsCourseAsset(url, block) {
      if (url.length !== 0 && url.indexOf('course/assets') == 0) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    };

    function ifUserIsMe(userId, block) {
      if (userId === Origin.sessionModel.get('id')) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    };

    function ifValueEquals(value, text, block) {
      if (value === text) {
        return block.fn(this);
      } else {
        return block.inverse(this);
      }
    };

    // checks for http/https and www. prefix
    function isAssetExternal(url) {
      if (url && url.length > 0) {
        var urlRegEx = new RegExp(/^(https?:\/\/)|^(www\.)/);
        return url.match(urlRegEx) !== null;
      } else {
        return true;
      }
    };

    function keyToTitleString(key) {
      if (!key) {
        return;
      }
      // Take in key value and remove all _'s and capitalise
      var string = key.replace(/_/g, "").toLowerCase();
      return this.capitalise(string);
    };

    function lowerCase(text) {
      return text.toLowerCase();
    };

    function momentFormat(date, format) {
      if (typeof date == 'undefined') {
        return '-';
      }
      return moment(date).format(format);
    };

    function numbers(index) {
      return index +1;
    };

    function odd(index) {
      return (index +1) % 2 === 0  ? 'even' : 'odd';
    };

    function pickCSV(list, key, separator) {
      var vals = [];
      separator = (separator && separator.length) ? separator : ',';
      if (list && list.length) {
        for (var i = 0; i < list.length; ++i) {
          if (key && list[i][key]) {
            vals.push(list[i][key]);
          } else {
            vals.push(list[i]);
          }
        }
      }
      return vals.join(separator);
    };

    function renderBooleanOptions(selectedValue) {
        var options = ["true", "false"];
        var html = '';

        for (var i = 0; i < options.length; i++) {
            var selected = selectedValue == options[i] ? ' selected' : '';
            html += '<option value="' + options[i] + '"' + selected + '>' + options[i] + '</option>';
        }

        return new Handlebars.SafeString(html);
    };

    function renderTags(list, key) {
      var html = '';

      if (list && list.length) {
        html = '<ul class="tag-container">';

        for (var i = 0; i < list.length; ++i) {
          var tag = (key && list[i][key]) ?
            list[i][key]
            : list[i];
          html += '<li class="tag-item" title="' + tag + '"><span class="tag-value">' + tag  + '</span></li>';
        }
        html += '</ul>';
      }

      return html;
    };

    function selected(option, value){
      if (option === value) {
        return ' selected';
      } else {
        return '';
      }
    };

    function stringToClassName(text) {
      if (!text) {
        return;
      }
      // Check if first character is an underscore and remove
      // Normally used for attribute with '_'s
      if (text.slice(1) === '_') {
        text = text.slice(1);
      }
      // Remove _ and spaces with dashes
      return text.replace(/_| /g, "-").toLowerCase();
    };

    function stripHtml(html) {
        return new Handlebars.SafeString(html);
    };

    function t(str, options) {
        for (var placeholder in options.hash) {
          options[placeholder] = options.hash[placeholder];
        }
        return (window.polyglot != undefined ? window.polyglot.t(str, options) : str);
    };

    function validateCourseConfirm(isConfirmed) {
      if (isConfirmed) {
        Origin.trigger('editor:courseValidation');
      }
    };

    function validateCourseContent(currentCourse) {
      // Let's do a standard check for at least one child object
      var containsAtLeastOneChild = true;
      var alerts = [];

      function iterateOverChildren(model) {
        // Return the function if no children - on components
        if(!model._children) return;

        var currentChildren = model.getChildren();

        // Do validate across each item
        if (currentChildren.length === 0) {
          containsAtLeastOneChild = false;

          alerts.push(
            "There seems to be a "
            + model.get('_type')
            + " with the title - '"
            + model.get('title')
            + "' with no "
            + model._children
          );
          return;
        } else {
          // Go over each child and call validation again
          currentChildren.each(function(childModel) {
            iterateOverChildren(childModel);
          });
        }
      }

      // call iterator
      iterateOverChildren(currentCourse);

      if(alerts.length > 0) {
        var errorMessage = "";
        for(var i = 0, len = alerts.length; i < len; i++) {
          errorMessage += "<li>" + alerts[i] + "</li>";
        }

        Origin.Notify.alert({
          type: 'error',
          title: window.polyglot.t('app.validationfailed'),
          text: errorMessage,
          callback: _.bind(this.validateCourseConfirm, this)
        });
      }

      return containsAtLeastOneChild;
    };

    for(var name in helpers) {
       if(helpers.hasOwnProperty(name)) {
             Handlebars.registerHelper(name, helpers[name]);
        }
    }

    return helpers;
});
