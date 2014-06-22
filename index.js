var _ = require('lodash');
var monk = require('monk');
var createPromise  = require('./lib/create_promise.js');
var slice = Array.prototype.slice;

/**
 * @param {String} connection
 * @param {String} collection
 * @param {Function} exports
 * @return {Function}
 */
module.exports = function(connection, collection, exports) {
  if (!connection) throw new Error('connection is required.');
  if (!collection) throw new Error('collection is required.');
  exports = typeof exports === 'function' ? exports : exports_;

  return function monk() {
    var api = createAPI(this, connection, collection);
    exports.call(this, api.Repository, api.methods);
  };
};

/**
 * exports api.
 *
 * @param {Function} Repository
 * @param {Object} methods
 */
function exports_(Repository, methods) {
  this.Repository = Repository;
  this.prototype.insert = methods.insert;
  this.prototype.update = methods.update;
  this.prototype.remove = methods.remove;
}

/**
 * @type {Array.<Object>} connections
 */
var connections = {};

/**
 * create api.
 *
 * @param {Function} Modelised
 * @param {String} connection
 * @param {String} collection
 * @return {Object}
 */
function createAPI(Modelised, connection, collection) {

  /**
   * @type {Function} Repository
   */
  function Repository() {}

  /**
   * connection.
   *
   * @return {Object}
   */
  Repository.connection = function() {
    return (connections[connection] = connections[connection] || monk(connection));
  };

  /**
   * collection.
   *
   * @return {Object}
   */
  Repository.collection = function() {
    return this.connection().get(collection);
  };

  /**
   * drop.
   *
   * @param {Function?} callback
   * @return {Object}
   */
  Repository.drop = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.drop.apply(collection, args.concat(function(err) {
        if (err) return reject(err);
        resolve();
      }));
    }.bind(this));
  };

  /**
   * find.
   *
   * @return {Object}
   */
  Repository.find = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.find.apply(collection, args.concat(function(err, docs) {
        if (err) return reject(err);
        resolve(instantiate(docs));
      }));
    }.bind(this));
  };

  /**
   * findOne.
   *
   * @return {Object}
   */
  Repository.findOne = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.findOne.apply(collection, args.concat(function(err, doc) {
        if (err) return reject(err);
        resolve(instantiate(doc));
      }));
    }.bind(this));
  };

  /**
   * findById.
   *
   * @return {Object}
   */
  Repository.findById = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.findById.apply(collection, args.concat(function(err, doc) {
        if (err) return reject(err);
        resolve(instantiate(doc));
      }));
    }.bind(this));
  };

  /**
   * findAndModify.
   *
   * @return {Object}
   */
  Repository.findAndModify = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.findAndModify.apply(collection, args.concat(function(err, doc) {
        if (err) return reject(err);
        resolve(instantiate(doc));
      }));
    }.bind(this));
  };

  /**
   * insert.
   *
   * @return {Object}
   */
  Repository.insert = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.insert.apply(collection, args.concat(function(err, doc) {
        if (err) return reject(err);
        resolve(instantiate(doc));
      }));
    }.bind(this));
  };

  /**
   * update.
   *
   * @return {Object}
   */
  Repository.update = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.update.apply(collection, args.concat(function(err, count) {
        if (err) return reject(err);
        resolve(count);
      }));
    }.bind(this));
  };

  /**
   * remove.
   *
   * @return {Object}
   */
  Repository.remove = function() {
    var args = appendCallback(slice.call(arguments));

    var collection = this.collection();
    return createPromise(args.pop(), function(resolve, reject) {
      collection.remove.apply(collection, args.concat(function(err, count) {
        if (err) return reject(err);
        resolve(count);
      }));
    }.bind(this));
  };

  /**
   * @type {Object} methods
   */
  var methods = {};

  /**
   * insert.
   *
   * @param {Function} callback
   * @return {Object}
   */
  methods.insert = function(callback) {
    callback = _.isFunction(callback) ? callback : _.noop;
    return createPromise(callback, function(resolve, reject) {
      Repository.insert(this.toJSON({ _id: Modelised.primaryKey() }), function(err, instance) {
        if (err) return reject(err);
        this.merge(instance.toJSON());
        this.clean();
        resolve(instance);
      }.bind(this));
    }.bind(this));
  };

  /**
   * update.
   *
   * @param {Function} callback
   * @return {Object}
   */
  methods.update = function(callback) {
    callback = _.isFunction(callback) ? callback : _.noop;
    return createPromise(callback, function(resolve, reject) {
      Repository.update({ _id: this.primary() }, { $set: this.diff() }, function(err, count) {
        if (err) return reject(err);
        this.clean();
        resolve(count);
      }.bind(this));
    }.bind(this));
  };

  /**
   * remove.
   *
   * @param {Function} callback
   * @return {Object}
   */
  methods.remove = function(callback) {
    callback = _.isFunction(callback) ? callback : _.noop;
    return createPromise(callback, function(resolve, reject) {
      Repository.remove({ _id: this.primary() }, function(err, count) {
        if (err) return reject(err);
        this.clean();
        resolve(count);
      }.bind(this));
    }.bind(this));
  };

  /**
   * instantiate.
   *
   * @param {Array|Object} objects
   * @return {Array|Object}
   */
  function instantiate(objects) {
    if (!_.isArray(objects)) {
      if (!(objects && objects._id)) return null;
      objects[Modelised.primaryKey()] = objects._id;
      return new Modelised(objects);
    }
    return _.map(objects, instantiate);
  }

  /**
   * appendCallback.
   *
   * @param {Array} args
   * @return {Array}
   */
  function appendCallback(args) {
    if (!_.isFunction(args[args.length - 1])) {
      args.push(_.noop);
    }
    return args;
  }

  /**
   * export api.
   */
  return { Repository: Repository, methods: methods };

}

