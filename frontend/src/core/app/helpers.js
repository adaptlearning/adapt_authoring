// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
    var _ = require('underscore');
    var Handlebars = require('handlebars');
    var Origin = require('coreJS/app/origin');
    var moment = require('moment');

    var helpers = {
        cacheBuster: function(context) {
          var currentUser = Origin.sessionModel.get('user');
          if(!currentUser) return '';

          var lastSession = new Date(currentUser.get('lastAccess'));
          var lastUpdated = new Date(context.updatedAt);
          if(lastSession < lastUpdated) return '?' + new Date().getTime()
        },

        getAssetIcon: function(context) {
          switch(context.assetType) {
            case 'image':
              return 'fa-image-o';
            case 'video':
              return 'fa-video-o';
            case 'audio':
              return 'fa-audio-o';
            default:
              return 'fa-file-o';
          }
        },

        console: function(context) {
          return console.log(JSON.stringify(context));
        },

        lowerCase: function(text) {
          return text.toLowerCase();
        },

        numbers: function(index) {
          return index +1;
        },

        capitalise:  function(text) {
          return text.charAt(0).toUpperCase() + text.slice(1);
        },

        odd: function (index) {
          return (index +1) % 2 === 0  ? 'even' : 'odd';
        },

        stringToClassName: function(text) {
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
        },

        keyToTitleString: function(key) {
          if (!key) {
            return;
          }
          // remove all _'s
          var s = key.replace(/_/g, "");
          // separate camel-cased words
          var capitalIndex = s.search(/[A-Z]{1}/);
          while(capitalIndex > 0) {
            s = s.slice(0,capitalIndex) + ' ' + s.slice(capitalIndex);
            capitalIndex = s.match(/[A-Z]{1}/);
          }
          // capitalise
          return this.capitalise(s);
        },

        formatDate: function(timestamp, noZero) {
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
        },

        momentFormat: function(date, format) {
          if (typeof date == 'undefined') {
            return '-';
          }
          return moment(date).format(format);
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
          if (url && url.length > 0) {
            var urlRegEx = new RegExp(/^(https?:\/\/)|^(www\.)/);
            return url.match(urlRegEx) !== null;
          } else {
            return true;
          }
        },

        ifValueEquals: function(value, text, block) {
            if (value === text) {
                return block.fn(this);
            } else {
                return block.inverse(this);
            }
        },

        ifListContains: function(list, query, block) {
            if(_.contains(list, query)) {
                return block.fn(this);
            } else {
                return block.inverse(this);
            }
        },

        ifUserIsMe: function(userId, block) {
          if (userId === Origin.sessionModel.get('id')) {
            return block.fn(this);
          } else {
            return block.inverse(this);
          }
        },

        getUserNameFromId: function(id) {
          if(Origin.sessionModel.get('user').get('_id') === id) {
            var user = Origin.sessionModel.get('user');
          } else if(Origin.sessionModel.get('users')) {
            var user = Origin.sessionModel.get('users').findWhere({ _id:id });
          };
          if(!user) return '';

          var names = [];

          if(user.get('firstName')) names.push(user.get('firstName'));
          if(user.get('lastName')) names.push(user.get('lastName'));

          return (names.length < 1) ? user.get('email') : names.join(' ');
        },

        selected: function(option, value){
            if (option === value) {
                return ' selected';
            } else {
                return ''
            }
        },

        counterFromZero: function(n, block) {
            var sum = '';
            for (var i = 0; i <= n; ++i)
                sum += block.fn(i);
            return sum;
        },

        counterFromOne: function(n, block) {
            var sum = '';
            for (var i = 1; i <= n; ++i)
                sum += block.fn(i);
            return sum;
        },

        t: function(str, options) {
            for (var placeholder in options.hash) {
              options[placeholder] = options.hash[placeholder];
            }
            return (window.polyglot != undefined ? window.polyglot.t(str, options) : str);
        },

        stripHtml: function(html) {
            return new Handlebars.SafeString(html);
        },

        escapeText: function(text) {
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(text));
            return div.innerHTML;
        },

        bytesToSize: function(bytes) {
            if (bytes == 0) return '0 B';

            var k = 1000,
             sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
             i = Math.floor(Math.log(bytes) / Math.log(k));

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

        pickCSV: function (list, key, separator) {
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
        },

        renderTags: function(list, key) {
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
        },
        decodeHTML: function(html) {
          var el = document.createElement('div');
          el.innerHTML = html;
          return el.childNodes.length === 0 ? "" : el.childNodes[0].nodeValue;
        },

        ifHasPermissions: function(permissions, block) {
          var permissionsArray = permissions.split(',');
          if (Origin.permissions.hasPermissions(permissionsArray)) {
            return block.fn(this);
          } else {
            return block.inverse(this);
          }
        },

        ifMailEnabled: function(block) {
          if (Origin.constants.useSmtp === true) {
            return block.fn(this);
          } else {
            return block.inverse(this);
          }
        },

        getAssetFromValue: function(url) {
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
        },

        ifImageIsCourseAsset: function(url, block) {
          if (url.length !== 0 && url.indexOf('course/assets') == 0) {
            return block.fn(this);
          } else {
            return block.inverse(this);
          }
        },

        getThumbnailFromValue: function(url) {
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

        },

        ifAssetIsExternal: function(url, block) {
            if(Handlebars.helpers.isAssetExternal(url)) {
                return block.fn(this);
            } else {
                return block.inverse(this);
            }
        },

        ifAssetIsHeroImage: function(url, block) {
          var urlSplit = url.split('/')
          if (urlSplit.length === 1) {
            return block.fn(this);
          } else {
            return block.inverse(this);
          }
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

        validateCourseContent: function(currentCourse) {
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
        },

      validateCourseConfirm: function(isConfirmed) {
        if (isConfirmed) {
          Origin.trigger('editor:courseValidation');
        }
      },

      isValidEmail: function(value) {
        var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (value.length === 0 || !regEx.test(value)) {
          return false;
        } else {
          return true;
        }
      }
    };

    for(var name in helpers) {
       if(helpers.hasOwnProperty(name)) {
             Handlebars.registerHelper(name, helpers[name]);
        }
    }

    return helpers;
});
