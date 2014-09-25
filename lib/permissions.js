var database = require('./database'),
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
  /^\/api\/register\/?$/,
  /^\/lang\/?.*$/,
  /^\/api\/resetpassword\/?$/,
  /^\/api\/createtoken\/?$/,
  /^\/api\/userpasswordreset\/?.*$/,
  /^\/preview\/?.*$/
];

// private - the various action types (REST)
var actionTypes = {
  'post'    : 'create',
  'get'     : 'read',
  'put'     : 'update',
  'patch'     : 'update',
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
      var index, el;
      var allowed = false;

      resource = this.tokens(resource);
      if (!resource) {
        callback(new Error('given resource is not a valid format'));
      }

      for (index = 0; index < statements.length; ++index) {
        el = statements[index];
        // check if action matches
        if (-1 === el.action.indexOf(action)) {
          // no point in further parsing of the statement
          continue;
        }

        // must share a namespace
        var toks = this.tokens(el.resource);
        if (!toks || toks.namespace !== resource.namespace) {
          // early return
          continue;
        }

        // check if the identifier captures the supplied identifier
        if (!this.captures(toks.identifier, resource.identifier)) {
          continue;
        }

        // we have a match, now we need to check the effect - an explicit deny has precedence
        el.effect = el.effect.toLowerCase();
        if (el.effect === 'deny') {
          allowed = false;
          break;
        } else if (el.effect === 'allow') { // explicitly require 'allow'
          allowed = true; // may be overridden by further statements
        }
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

  buildResourceString: function (tenantid, path) {
    // @TODO: This method of building the resource string might change significantly
    // Ryan and I (DPMH) have hummed and haahed about it, but this will do for now
    tenantid = tenantid || '0';
    path = path || '/__unknown__'; // unlikely to be a real route
    return 'urn:x-adapt:' + tenantid + path;
  },

  /**
   * creates a new policy document for a user
   *
   * @param {ObjectId} userId - the id of the user to create the policy for
   * @param {function} callback - function of the form function (error, policy)
   */

  createPolicy: function (userId, callback) {
    database.getDatabase(function(err, db){
      db.create('policy', {user: userId}, function (error, policy) {
        if (error || !policy) {
          callback(error);
        } else {
          callback(null, policy);
        }
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
    database.getDatabase(function(err, db){

	    var i = 0;
	    var statements = [];

	    db.retrieve('policy', {user: userId}, function (error, results) {
	      if (error) {
	        callback(error);
	      } else if (!results || 0 === results.length) { // no policies set for this user
	        callback(null, false);
	      } else {
	        // if more than one policy is found, join statements
	        for (i = 0; i < results.length; ++i) {
	          statements = statements.concat(results[i].statement);
	        }

	        new PolicyStatementParser(action, resource, statements, function (error, parser) {
	          if (error) {
	            callback(error);
	          } else {
	            parser.parse(callback);
	          }
	        });
	      }
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
    var that = this;
    return function (req, res, next) {
      // first check if the route should be ignored
      if (that.shouldIgnore(req.url)) {
        next();
        return;
      }

      var user = req.session.passport && req.session.passport.user;
      if (!user || !user._id) {
        res.statusCode = 403;
        return res.json({statusCode: STATUS.NOT_AUTHENTICATED});
      }

      // build path from req.url
      var resource = that.buildResourceString(user.tenant._id, req.url);
      var action = that.getActionType(req.method.toLowerCase()); // at this point, we can only enforce CRUD methods
      that.hasPermission(user._id, action, resource, function (error, allowed) {
        if (error) {
          // summat went wrong
          res.statusCode = 500;
          return res.json(error);
        }
        
        if (allowed) {
          // if we have permission, just continue
          return next();
        }
        
        // denied!
        res.statusCode = 403;
        return res.json({statusCode: STATUS.ACCESS_DENIED});
      });
    };
  }
};

