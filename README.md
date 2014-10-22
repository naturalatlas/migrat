# Migrat

*Migrat is a generic Node.js migration tool.* Use it to migrate data in PostgreSQL, MySQL, Cassandra, etc or even regenerate local caches. It's designed for multi-node environments.

It's not as simple to set up as others like [node-migrate](https://www.npmjs.org/package/migrate), but it's designed to be much more robust – capable of handling very diverse stacks and processes.

```sh
$ migrat create add-user-table
# creates migrations/1413963352671-add-user-table.js
$ migrat create add-user-table --all-nodes
# creates migrations/1413963352671-add-user-table.all.js

# show which migrations need to be run:
$ migrat status

# get up to date
$ migrat up
```

### Features

- Reads [NIST] time when creating migrations. Clocks aren't always in sync, especially if working in a VM.
- Supports global locking during migration runs, to prevent multiple servers attempting perform global migrations at the same time.
- Migrations can be set to set to run once globally, or once per server.

## Migration Files

Migration files are pretty standard:

```js
// (required) apply the change
module.exports.up = function(context, callback) { /* ... */ };

// (required) revert the change
module.exports.down = function(context, callback) { /* ... */ };

// (optional) verify the change took place
module.exports.verify = function(context, callback) { /* ... */ };
```

## Configuration

Migrat will look for for a `migrat.config.js` in your project directory, unless overriden by `--config`:

```js
module.exports = {
    // REQUIRED. The folder to store migration scripts in.
    migrationsDir: './migrations',

    // OPTIONAL. Invoked at the beginning of a run, this method
    // should return an object with any details you want passed
    // through to all migrations. This can be database connections,
    // logging interfaces, etc.
    context: function(callback) { /* ... */ },

    // REQUIRED. Where the current migration state specific to the
    // current machine is to be stored. This is only used to for
    // migrations created with the `--all-nodes` flag. Make sure
    // it is writable by the user executing migrat.
    localState: '/var/lib/my_app.migrat',

    // REQUIRED. Persists the current migration state. The `state`
    // argument will always be a variable-length string. Store it
    // to redis, disk, database, ... whatever suits you.
    storeState: function(state, callback) { /* ... */ },

    // REQUIRED. This method is responsible for fetching the
    // current migration state, persisted by `storeState`.
    fetchState: function(callback) { /* ... */ },

    // OPTIONAL. Provide a function that returns a string to use
    // as the source for a new migration file. The `details`
    // argument will be an object containing:
    //   * "filename"  The name of migration file.
    //   * "time"      The Date object used to put the timestamp
    //                 at the beginning of the migration filename.
    migrationTemplate: function(details) {
        fs.readFileSync('path/to/template.js', 'utf8')
    },

    // OPTIONAL. Invoked at the beginning of a migration
    // run. Use this to establish a global lock. You can
    // either wait for a lock to become available, or fail.
    lock: function(callback) { /* ... */ },

    // OPTIONAL. The number of seconds to give up after if
    // a lock cannot be obtained. This is only applicable
    // if the `lock` function is implemented.
    lockTimeout: 0,

    // OPTIONAL. (unless `lock` is implemented). Implement this to
    // release any global lock acquired by the `lock` function.
    unlock: function(callback) { /* ... */ },

    // OPTIONAL. Whether or not to attempt to roll back to the
    // state that existed at the beginning of the run if a migration
    // fails. Note: this only applies to "up" operations (default: true)
    rollbackOnFail: true,

    // OPTIONAL. Callback executed before each migration.
    beforeEach: function(filename, method, callback) { /* ... */ },

    // OPTIONAL. Callback executed after each migration.
    afterEach: function(err, filename, method, callback) { /* ... */ },

    // OPTIONAL. Callback executed right before all
    // queued migrations are executed.
    beforeRun: function(method, to, callback) { /* ... */ },

    // OPTIONAL. Callback executed right before all
    // queued migrations are executed.
    afterRun: function(err, method, to, callback) { /* ... */ }
};
```

## License

Copyright &copy; 2014 [Brian Reavis](https://github.com/brianreavis) & [Contributors](https://github.com/naturalatlas/migrat/graphs/contributors)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.