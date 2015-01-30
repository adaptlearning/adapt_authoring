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
      switch (props[key].type) {
        case "boolean":
        case "integer":
        case "number":
        case "string":
          child[key] = props[key].default || null;
          break;
        case "array":
          child[key] = [];
          break;
        case "object":
          child[key] = walkObject(props[key].properties);
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

exports = module.exports = {
  schemaToObject: schemaToObject,
  grantSuperPermissions: grantSuperPermissions
};
