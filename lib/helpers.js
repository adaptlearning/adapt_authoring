// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var rolemanager = require('./rolemanager');
var database = require('./database');
var logger = require('./logger');
var configuration = require('./configuration');

/**
 * function generates an object from json schema - could not find a lib to do this for me :-\
 * if anyone knows of a node lib to generate an object from a json schema, please fix this!
 * based on http://stackoverflow.com/questions/13028400/json-schema-to-javascript-typed-object#answer-16457667
 *
 */
function schemaToObject (schema, id, version, location) {
  if (!this.memo) {
    this.memo = Object.create(null);
  }

  // check if we have already built this object
  var identifier = id + '#' + version + '/' + location;
  if (this.memo[identifier]) {
    return this.memo[identifier];
  }

  var walkObject = function (props) {
    var child = {};
    Object.keys(props).forEach(function (key) {
      var prop = props[key];

      switch (prop.type) {
        case "boolean":
          child[key] = prop.default || false;
          break;
        case "integer":
        case "number":
          child[key] = +prop.default || 0;
          break;
        case "string":
          child[key] = prop.default || "";
          break;
        case "array":
          child[key] = prop.default || [];
          break;
        case "object":
          child[key] = walkObject(prop.properties);
          break;
        default:
          break;
      }
    });

    return child;
  };

  // memoize the result
  if (schema) {
    this.memo[identifier] = walkObject(schema);
    return this.memo[identifier];
  }

  return false;
}


/**
 * Grants super permissions via a policy file for the given userId.
 * Perhaps we should have another function called kryptonite to remove super :)
 *
 * @param {objectid} userId
 * @param {objectid} tenantId
 * @param {callback} next
 */

function grantSuperPermissions (userId, next) {
  if (!userId) {
    return next(new Error("Failed to grant super user permissions, invalid userId: " + userId));
  }

  var _assignSuperRole = function (userId, cb) {
    // verify the Super Admin role is installed
    rolemanager.retrieveRole({ name: "Super Admin" }, function (err, role) {
      if (err) {
        return cb(err);
      }

      if (role) {
        return rolemanager.assignRole(role._id, userId, cb);
      }

      // role does not exist, bah!
      return cb(new Error('Role not found'));
    });
  };

  _assignSuperRole(userId, function (err) {
    if (!err) {
      // no problem, role was assigned
      return next(null);
    }

    // otherwise we need to install default roles
    rolemanager.installDefaultRoles(function (err) {
      if (err) {
        return next(err);
      }

      // the second attempt passes control back to the first callback
      _assignSuperRole(userId, next);
    });
  });
}

function isMasterPreviewAccessible(courseId, userId, next) {
     database.getDatabase(function(err, db) {
      if (err) {
        logger.log('error', err);
        return err;
      }

      db.retrieve('course', { _id: courseId }, {jsonOnly: true}, function (err, results) {
        if (err) {
          logger.log('error', err);
          return next(err);
        }

        if (results && results.length == 1) {
          var course = results[0];

          if (course._isShared || course.createdBy == userId) {
            // Shared courses on the same tenant are open to users on the same tenant
            return next(null, true);
          }

          return next(null, false);

        } else {
          return next(new Error('Course ' + courseId + ' not found'));
        }
      });
    }, configuration.getConfig('dbName'));
}

function hasCoursePermission (action, userId, tenantId, contentItem, next) {
  // Check that the contentItem has something resembling a courseId
  if (contentItem.hasOwnProperty('_id') || contentItem.hasOwnProperty('_courseId')) {
    var courseId = contentItem && contentItem._courseId
        ? contentItem._courseId.toString()
        : contentItem._id.toString();

    database.getDatabase(function(err, db) {
      if (err) {
        logger.log('error', err);
        return err;
      }

      db.retrieve('course', { _id: courseId }, {jsonOnly: true}, function (err, results) {
        if (err) {
          logger.log('error', err);
          return next(err);
        }

        if (results && results.length == 1) {
          var course = results[0];

          if ((course._isShared || course.createdBy == userId) && course._tenantId.toString() == tenantId) {
            // Shared courses on the same tenant are open to users on the same tenant
            return next(null, true);
          }

          return next(null, false);

        } else {
          return next(new Error('Course ' + courseId + ' not found'));
        }
      });
    });
  } else {
    // Course permission cannot be verified
    return next(null, false);
  }
}

/**
 * Replaces ALL instances of the search parameter in a given string with a replacement
 * @param {string} str
 * @param {string} search
 * @param {string} replacement
 **/
function replaceAll(str, search, replacement) {
  return str.split(search).join(replacement);
}

/**
 * Returns a slugified string, e.g. for use in a published filename
 * Removes non-word/whitespace chars, converts to lowercase and replaces spaces with hyphens
 * Multiple arguments are joined with spaces (and therefore hyphenated)
 * @return {string}
 **/
function slugify() {
  var str = Array.apply(null,arguments).join(' ');
  var strip_re = /[^\w\s-]/g;
  var hyphenate_re = /[-\s]+/g;

  str = str.replace(strip_re, '').trim()
  str = str.toLowerCase();
  str = str.replace(hyphenate_re, '-');

  return str;
}

exports = module.exports = {
  schemaToObject: schemaToObject,
  grantSuperPermissions: grantSuperPermissions,
  hasCoursePermission: hasCoursePermission,
  isMasterPreviewAccessible: isMasterPreviewAccessible,
  replaceAll: replaceAll,
  slugify: slugify
};
