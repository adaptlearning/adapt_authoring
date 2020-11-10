// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
var _ = require('underscore'),
    database = require('./database'),
    async = require('async'),
    configuration = require('./configuration');

// private - used for validating effects
var validEffects = ['allow', 'deny'];

// private - no permissions check on these routes
var ignoreRoutes = [
  /^\/\/?$/,
  /^\/install\/?.*$/,
  /^\/api\/login\/?$/,
  /^\/api\/logout\/?$/,
  /^\/api\/authcheck\/?$/,
  /^\/lang\/?.*$/,
  /^\/config\/?.*$/,
  /^\/api\/createtoken\/?$/,
  /^\/api\/userpasswordreset\/?.*$/,
  /^\/api\/my\/course\/?.*$/,
  /^\/api\/shared\/course\/?.*$/,
  /^\/api\/duplicatecourse\/?.*$/,
  /^\/api\/subscribed\/?.*$/,
  /^\/api\/theme\/?.*$/,
  /^\/api\/themepreset\/?.*$/,
  /^\/api\/menu\/?.*$/,
  /^\/api\/extension\/?.*$/,
  /^\/api\/themetype\/?$/,
  /^\/api\/menutype\/?$/,
  /^\/api\/extensiontype\/?$/,
  /^\/api\/componenttype\/?$/,
  /^\/api\/theme\/?$/,
  /^\/api\/menu\/?$/,
  /^\/preview\/?.*$/,
  /^\/loading\/?.*$/,
  /^\/download\/?.*$/,
  /^\/poll\/?.*$/,
  /^\/api\/auth\/?.*$/
];

// private - the various action types (REST)
var actionTypes = {
  'post'    : 'create',
  'get'     : 'read',
  'put'     : 'update',
  'patch'   : 'update',
  'delete'  : 'delete'
};

var STATUS = {
  NOT_AUTHENTICATED: "not-authenticated",
  ACCESS_DENIED: "access-denied"
};

/**
 * Provides a parser object to a callback that. Clients can call
 * parser.parse(function(error,allowed) {}); to determine if the supplied
 * action is permitted by the supplied statements
 *
 *
 * @param {string} action - action to verify
 * @param {string} resource - uri identifies a resource
 * @param {array} statements - list of statements from one or more policies
 * @callback callback - function of the form function (error, parser)
 */

function PolicyStatementParser(action, resource, statements, callback) {
  // first validate the arguments
  if (!(action && 'string' === typeof action) ||
      !(resource && 'string' === typeof resource) ||
      !(statements && Object.prototype.toString.apply(statements) === '[object Array]')) {
    callback(new Error('function received invalid arguments'));
  }

  callback(null, {

    /**
     * creates an object of the form: {scheme: 'scheme', namespace: 'namespace', identifier: ''}
     * from the supplied res uri
     *
     * @param {string} res - the resource uri
     */

    tokens: function (res) {
      res = res.split(':');
      if (!res || 3 !== res.length) {
        return false;
      }

      return {
        scheme     : res[0],
        namespace  : res[1],
        identifier : res[2]
      };
    },

    /**
     * Checks if a resource uri pattern matcher matches a resource uri
     *
     * @param {string} pattern - resource matching pattern from a statement
     * @param {target} target - the resource uri to match against
     * @return {boolean} true if it pattern includes target, false otherwise
     */

    captures: function (pattern, target) {
      var captured = false;
      if ('string' !== typeof pattern || 'string' !== typeof target) {
        return captured;
      }
      pattern = pattern.split('/');
      target = target.split('/');

      // will iterate over all tokens in pattern until a non-match is found
      // if all tokens are matched either by an exact string or glob, te result
      // is truthy
      captured = pattern.every(function (el, index, array) {
        if (pattern[index] === '*' || pattern[index] === target[index]) {
          return true;
        }

        return false;
      });

      return captured;
    },

    /**
     * The meat and potatoes of the policy parser - this will tell clients
     * if the given action is permitted in the context of the given resource
     *
     * @callback cb - function of the form function(error, allowed)
     */
    parse: function (cb) {
      let allowed = false;

      const resourceToken = this.tokens(resource);

      if (!resourceToken) {
        return callback(new Error('given resource is not a valid format'));
      }
      for(let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        if (!statement.action.includes(action)) { // check if action matches
          continue;
        }
        const statementToken = this.tokens(statement.resource) || {};
        const sharesNamespace = statementToken.namespace === resourceToken.namespace;
        const matchesResource = this.captures(statementToken.identifier, resourceToken.identifier);

        if(!sharesNamespace || !matchesResource) {
          continue;
        }
        const effect = statement.effect.toLowerCase();
        if(effect === 'deny') { // explicit deny has precedence
          allowed = false;
          break;
        }
        if(effect === 'allow') allowed = true; // this may be overridden by further statements
      }
      cb(null, allowed);
    }
  });

}

// module exports
exports = module.exports = {

  /**
   * Routes added here will not be permission checked
   *
   * @param {RegExp|string} route - a route to ignore
   */

  ignoreRoute: function (route) {
    // force a regex
    if ('string' === typeof route) {
      route = new RegExp(route);
    }

    // ignore dupes
    if (-1 === ignoreRoutes.indexOf(route)) {
      ignoreRoutes.push(route);
    }
  },

  /**
   * Should this route be ignored?
   *
   * @param {string} route - the route to check
   * @return {boolean} true if we should ignore this route, otherwise false
   */

  shouldIgnore: function (route) {
    // regex test expensive?
    return ignoreRoutes.some(function (el, index, array) {
      return el.test(route);
    });
  },

  /**
   * return a list of valid effects
   *
   * @return {array} list of valid effect strings
   */

  getValidEffects: function () {
    return validEffects;
  },

  /**
   * maps http request methods to actions
   *
   * @param {string} method - an http request method
   * @return {string} action definition
   */

  getActionType: function (method) {
    if (actionTypes[method]) {
      return actionTypes[method];
    }

    return 'undefined';
  },

  /**
   * buildResourceString builds an adapt urn based on the passed params
   *
   * @param {string} tenantid - a tenantid
   * @param {string} path - a path starting from / (the server root)
   * @return {string} a formatted resource string
   */

  buildResourceString: function (tenantid = '0', path = '/__unknown__') {
    return `urn:x-adapt:${tenantid}${path}`;
  },

  /**
   * creates a new policy document for a user
   *
   * @param {ObjectId} userId - the id of the user to create the policy for
   * @param {object} [options] - optional settings
   * @param {function} callback - function of the form function (error, policy)
   */

  createPolicy: function (userId, options, callback) {
    if ('function' === typeof options) {
      callback = options;
      options = {
        useExisting: true
      };
    }

    this.getPolicy(userId, function (err, policy) {
      // only create a new policy if specifically requested
      if (policy && options.useExisting) {
        return callback(null, policy);
      }

      database.getDatabase(function(err, db){
        db.create('policy', {user: userId}, function (error, policy) {
          if (error) {
            return callback(error);
          } else if (!policy) {
            return callback(new Error('Policy creation failed!!'));
          }

          return callback(null, policy);
        });
      }, configuration.getConfig('dbName'));
    });
  },

  /**
   * updates a policy document
   *
   * @param {ObjectId} policyId - the id of the policy
   * @param {function} callback - function of the form function (error, policy)
   */

  updatePolicy: function (policyId, delta, callback) {
    database.getDatabase(function(err, db){
      if (err) {
        return callback(err);
      }

      db.update('policy', { _id: policyId}, delta, function (error) {
        if (error) {
          return callback(error);
        }

        return callback(null);
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves a single policy for a user
   *
   * @param {ObjectId} userId - the id of the user to create the policy for
   * @param {object} [search] - optional search query
   * @param {function} callback - function of the form function (error, policy)
   */

  getPolicy: function (userId, search, callback) {
    if ('function' === typeof search) {
      callback = search;
      search = {};
    }

    search.user = search.user || userId;

    database.getDatabase(function(err, db){
      db.retrieve('policy', search, function (error, policies) {
        if (error) {
          return callback(error);
        }

        // only return the first items
        return callback(null, (policies.length && policies[0]));
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * retrieves all policies for a user
   *
   * @param {ObjectId} userId - the id of the user to create the policy for
   * @param {function} callback - function of the form function (error, policy)
   */

  getPolicies: function (userId, callback) {
    database.getDatabase(function(err, db){
      db.retrieve('policy', {user: userId}, function (error, policies) {
        if (error) {
          callback(error);
        } else {
          callback(null, policies);
        }
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * adds a statement to the given policy and saves it
   *
   * @param {object} policy - the policy to change
   * @param {string|string[]} actions - action string or list of actions strings
   * @param {string} resource - a URN indentifying a resource
   * @param {string} [effect] - optional effect for a statement - see PolicyStatment.schema for default value (required if condition supplied)
   * @param {object} [condition] - a conditional object
   * @callback callback - of the form function (error, policy)
   */

  addStatement: function (policy, actions, resource, effect, condition, callback) {
    database.getDatabase(function(err, db){
        var statement = policy.statement || [];

        // determine if actions is a single or list
        if (Object.prototype.toString.apply(actions) !== '[object Array]') {
          if ('string' !== typeof actions) {
            throw new Error('actions parameter must be string or array', actions);
          }

          // make single action a list
          actions = [actions];
        }

	    // resolve effect, conditions, callback
        if ('function' === typeof effect) { // only callback was supplied
          callback = effect;
          effect = ''; // will get default from schema
          condition = {};
        } else if ('function' === typeof condition) { // effect was supplied, condition wasn't
          callback = condition;
          condition = {};
        }

        // @TODO - validate resource, actions? Schema to do this?
        // validate effect
        effect = effect.toLowerCase();
        if (-1 === this.getValidEffects().indexOf(effect)) {
          throw new Error('supplied effect is not valid: ' + effect);
        }

        statement.push({
          'effect': effect,
          'action': actions,
          'resource': resource,
          'condition': condition
        });

        // save policy - only allow saving if _id is matched
        db.update('policy', { _id: policy._id }, { 'statement': statement }, callback);
    }.bind(this), configuration.getConfig('dbName'));
  },

  /**
   * checks if a user has a particular permission
   *
   * @param {ObjectId} userId - the id of the user to remove policies for
   * @param {string} action - the action to check
   * @param {string} resource - the resource to check
   * @param {function} callback - function of the form function (error, allowed)
   */

  hasPermission: function (userId, action, resource, callback) {
    this.getUserPolicyStatements(userId, function (error, statements) {
      if (error) {
        return callback(error);
      }
      if (!statements || 0 === statements.length) { // no policies set for this user
        return callback(null, false);
      }
      new PolicyStatementParser(action, resource, statements, function (error, parser) {
        if (error) {
          return callback(error);
        }
        return parser.parse(callback);
      });
    });
  },

  /**
   * retrieves policy statements mapped against a user, including
   * those from role assignments
   *
   * @param {objectid} userId - the id of the user
   * @param {callback} callback
   */

  getUserPolicyStatements: function (userId, callback) {
    database.getDatabase(function(err, db) {
      db.retrieve('user', { _id: userId }, { fields: 'roles _tenantId', populate: ['roles'] }, function(err, userDocs) {
        if (err) {
          return callback(err);
        }
        if (1 !== userDocs.length) {
          return callback(new Error('Failed to find unique user record'));
        }
        const { roles, _tenantId } = userDocs[0];

        if (!roles || !roles.length) {
          return callback(null, []);
        }
        const statements = [];
        // add role-specific statements
        roles.forEach(r => {
          r.statement.forEach(s => {
            s.resource = s.resource.replace('{{tenantid}}', _tenantId);
            statements.push(s);
          });
        });
        db.retrieve('policy', { user: userId }, function(error, policyDocs) {
          if (err) {
            return callback(err);
          }
          if (!policyDocs || !policyDocs.length) {
            return callback(null, statements);
          }
          // add user-specific policy statements
          policyDocs.forEach(p => statements.push(...p.statement));
          callback(null, statements);
        });
      });
    }, configuration.getConfig('dbName'));
  },

  /**
   * removes all policies for a user
   *
   * @param {ObjectId} userId - the id of the user to remove policies for
   * @param {function} callback - function of the form function (error, policy)
   */

  clearPolicies: function (userId, callback) {
    database.getDatabase(function(err, db){
	    db.destroy('policy', {user: userId}, function (error) {
	      callback(error);
	    });
    }, configuration.getConfig('dbName'));
  },

  /**
   * Provides an express middleware function to verify access to the req.url
   *
   * @return {function}
   */

  policyChecker: function () {
    return (req, res, next) => {
      if(this.shouldIgnore(req.url)) {
        return next(); // route has been explicitly ignored somewhere
      }
      const user = app.usermanager.getCurrentUser();

      if (!user || !user._id) {
        return res.status(403).json({ statusCode: STATUS.NOT_AUTHENTICATED });
      }
      const action = this.getActionType(req.method.toLowerCase());
      const resource = this.buildResourceString(user.tenant._id, req.path);

      this.hasPermission(user._id, action, resource, function (error, allowed) {
        if(error) {
          return res.status(500).json(error);
        }
        if(!allowed) {
          return res.status(403).json({ statusCode: STATUS.ACCESS_DENIED });
        }
        next(); // we have permission, continue with the middleware stack
      });
    }
  },

  getUserPermissions: function(userId, callback) {
    if (!userId) {
      return callback(null, []);
    }

    var userPermissions = [];

    database.getDatabase(function (error, db) {
      if (error) {
        return callback(error);
      }

      var search = { _id: userId };
      var options = {
        populate: {
          roles: '_id statement'
        }
      };

      db.retrieveOne('user', search, options, function (error, user) {
        if (error) {
          return callback(error);
        }

        if (!user) {
          return callback(new Error('User not found: ' + userId));
        }

        // Would be nice if db.retrieve could be used with findOne
        var roles = user.roles;
        var userStatements = [];

        // Go through each role assigned to the user
        async.eachSeries(
          roles,
          function(role, rolesCallback) {
            // Fetch the statements from the roles collection
            // (No DB call, because we used populate)
            // also, I've added a utility function db.retrieveOne for ya, Daryl ;)
            userStatements.push(role.statement);
            rolesCallback();
          },
          function() {
            // Flatten the arrays and make them unique
            var uniqueStatements = _.union(_.flatten(userStatements));

            // Go through each statement and build permissionString ready to push
            // to the user model
            async.eachSeries(
              uniqueStatements,
              function(userStatement, uniqueStatementsCallback) {

                var apiString = userStatement.resource.replace('urn:x-adapt:', '').replace('/api', '');

                var statementActions = userStatement.action;
                async.eachSeries(
                  statementActions,
                  function(statementAction, statementActionsCallback) {

                    var permissionString = apiString + ':' + statementAction;
                    userPermissions.push(permissionString);

                    statementActionsCallback();
                  }, function() {
                    uniqueStatementsCallback();
                  }
                );
              }, function() {
                // After all that - push back the callback
                return callback(null, userPermissions);
              }
            );
          }
        );
      });
    }, configuration.getConfig('dbName')); // need to target master tenant

  }
};
