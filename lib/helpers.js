// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var async = require('async');
var configuration = require('./configuration');
var database = require('./database');
var logger = require('./logger');
var permissions = require('./permissions');
var rolemanager = require('./rolemanager');

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
          var nestedProps = prop.properties;
          child[key] = nestedProps ? walkObject(nestedProps) : prop.default || {};
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

/**
* Check for full CRUD permissions
* Not ideal, but no better way to check multiple actions
*/
function hasSuperCoursePermission(userId, tenantId, next) {
  const actions = ['create','read','update','delete'];
  const resource = permissions.buildResourceString(tenantId, '/api/content/course');
  async.every(actions, (action, cb) => permissions.hasPermission(userId, action, resource, cb), next);
}

function hasCoursePermission (action, userId, tenantId, contentItem, next) {
  // Check that the contentItem has something resembling a courseId
  if(contentItem && !contentItem._id && !contentItem._courseId) {
    return next();
  }
  database.getDatabase(function(err, db) {
    if(err) {
      logger.log('error', err);
      return next(err);
    }
    const courseId = contentItem && contentItem._courseId ? contentItem._courseId.toString() : contentItem._id.toString();

    db.retrieve('course', { _id: courseId }, { jsonOnly: true }, function (err, results) {
      if(err) {
        logger.log('error', err);
        return next(err);
      }
      if(!results || results.length !== 1) {
        return next(new Error(`Course ${courseId} not found`));
      }
      const course = results[0];

      if(course._tenantId.toString() !== tenantId) { // no access across tenants
        return next();
      }
      hasSuperCoursePermission(userId, tenantId, function(error, hasSuperPermission) {
        if(error) {
          return next(error);
        }
        if(hasSuperPermission) { // allow user with full CRUD permissions
          return next(null, true);
        }
        if(course.createdBy.toString() === userId) { // user's own course
          return next(null, true);
        }
        if(course._isShared) { // shared with _all_ users
          return next(null, true);
        }
        if(course._shareWithUsers && course._shareWithUsers.length) { // check if userId is in _shareWithUsers
          return next(null, course._shareWithUsers.map(user => user.toString()).includes(userId));
        }
        next();
      });
    });
  });
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

function cloneObject(obj) {
  var clone = {};
  if(!obj) return clone;

  Object.keys(obj).forEach(function(key) {
    var prop = obj[key];
    // type-specific copying
    switch(Object.prototype.toString.call(prop).match(/\[object (.+)\]/)[1]) {
      case 'Number':
        clone[key] = Number(prop);
        break;
      case 'String':
        clone[key] = String(prop);
        break;
      case 'Array':
        clone[key] = prop.slice();
        break;
      case 'Object':
        clone[key] = cloneObject(prop);
        break;
      case 'Null':
        clone[key] = null;
        break;
      case 'Undefined':
        clone[key] = undefined;
        break;
      default:
        clone[key] = prop;
    }
  });
  return clone;
}

function isValidEmail(value) {
  var regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return (value && value.length !== 0 && regEx.test(value))
}

exports = module.exports = {
  schemaToObject: schemaToObject,
  grantSuperPermissions: grantSuperPermissions,
  hasCoursePermission: hasCoursePermission,
  isValidEmail: isValidEmail,
  replaceAll: replaceAll,
  slugify: slugify,
  cloneObject: cloneObject
};
