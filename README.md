modelis-monk
===============

monk plugin for modelis.

### [monk](http://github.com/LearnBoost/monk)

#### Export API

- Repository.connection
- Repository.collection
- Repository.drop
- Repository.find
- Repository.findOne
- Repository.findById
- Repository.findAndModify
- Repository.insert
- Repository.update
- Repository.remove
- methods.insert
- methods.update
- methods.remove

#### Option

- ```connection``` (required)
  - monk connection.
- ```collection``` (required)
  - mongodb collection name.

#### Example

##### use.

```js
var Modelis = require('modelis');
var monk = require('modelis-monk');

// define.
var User = Modelis.define('User').attr('name').attr('age');

if (simple) {
  // use.
  User.use(monk('localhost/test', 'users'));

  // User.Repository available.
  User.Repository.drop(function() {});

  // methods available.
  new User({}).insert(function() {});
}

if (customize) {
  // use.
  User.use(monk('localhost/test', 'users'), function(Repository, methods) {

    this.Store = Repository;

    this.prototype.save = function() {
      if (this.primary() === undefined) {
        return methods.insert.apply(this, arguments);
      } else {
        return methods.update.apply(this, arguments);
      }
    };

    this.prototype.remove = methods.remove;
  });

  // User.Store available.
  User.Store.drop(function() {});

  // methods available.
  new User({}).save(function() {});
}
```

##### callback

```js
var Modelis = require('modelis');
var monk = require('modelis-monk');

// define.
var User = Modelis.define('User').attr('name').attr('age');

// use.
User.use(monk('localhost/test', 'users'));

// connection.
User.Repository.connection(); //=> monk connection.

// collection.
User.Repository.collection(); //=> monk collection.

// insert.
new User({ name: 'john', age: 19 }).insert(function(err, success) {

  // find.
  User.Repository.findOne({ name: 'john' }, function(err, user) {

    // update.
    user.set('name', 'bob').update(function(err, success) {

      // remove.
      user.remove(function(err, success) {});
    });
  });
});
```

##### generators(co)

```js
var Modelis = require('modelis');
var monk = require('modelis-monk');
var co = require('co');

// define.
var User = Modelis.define('User').attr('name').attr('age');

// define plugin.
User.use(monk('localhost/test', 'users'));

co(function*() {
  // insert.
  var inserted = yield new User({ name: 'john', age: 19 }).insert();
  inserted.get('name'); //=> john

  // find.
  var found = yield User.Repository.findById(inserted.primary());
  found.get('name') //=> john

  // update.
  yield found.set('name', 'bob').update();
  var updated = yield User.Repository.findById(found.primary());
  updated.get('name') //=> bob

  // remove.
  yield updated.remove();
  var removed = yield User.Repository.findById(updated.primary());
  removed === null; //=> true. `updated` was deleted.
})();
```

