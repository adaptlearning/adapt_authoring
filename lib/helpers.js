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

exports = module.exports = {
  schemaToObject: schemaToObject
};
