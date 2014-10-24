var fs = require('fs');

module.exports = {
	migrationsDir: './migrations',

	// REQUIRED. Where the current migration state specific to the
	// current machine is to be stored. This is only used to for
	// migrations created with the `--all-nodes` flag. Make sure
	// it is writable by the user executing migrat.
	localState: '/var/lib/my_app.migratdb',

	// REQUIRED. Persists the current global migration state. The
	// `state` argument will always be a variable-length string.
	// Store it to redis, disk, database, ... whatever suits you.
	storeState: function(state, callback) {
		fs.writeFile('/var/lib/my_app.global.migratdb', state, 'utf8', callback);
	},

	// REQUIRED. This method is responsible for fetching the
	// current global migration state, persisted by `storeState`.
	fetchState: function(callback) {
		fs.readFile('/var/lib/my_app.global.migratdb', 'utf8', function(err, content) {
			if (err.code === 'ENOENT') return callback();
			callback(err, content);
		});
	},

	// OPTIONAL. Invoked at the beginning of a run, this method
	// should return an object with any details you want passed
	// through to all migrations. This can be database
	// connections, logging interfaces, etc.
	context: function(callback) {
		callback(null, {});
	}

	// OPTIONAL. Invoked at the beginning of a migration
	// run. Use this to establish a global lock. You can
	// either wait for a lock to become available, or fail.
	//
	// lock: function(callback) { callback(); },

	// OPTIONAL. The number of milliseconds to give up after if
	// a lock cannot be obtained or released. This is only
	// applicable if the `lock` function is implemented.
	//
	// lockTimeout: 0,

	// OPTIONAL. (unless `lock` is implemented). Implement this to
	// release any global lock acquired by the `lock` function.
	//
	// unlock: function(callback) { callback() },

	// initialize: function(callback) { callback(); },
	// beforeEach: function(runlist_item, callback) { callback(); },
	// afterEach: function(err, runlist_item, callback) { callback(); },
	// beforeRun: function(runlist, callback) { callback(); },
	// afterRun: function(err, runlist, callback) { callback(); },
	// terminate: function(callback) { callback(); }
};