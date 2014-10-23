module.exports = {
	localState: '../../temp/lock-timeout-project.migratdb',
	migrationsDir: './migrations',
	fetchState: function(callback) { callback(null, '{}'); },
	storeState: function(state, callback) { callback(); },
	lock: function(callback) {
		// never call callback to cause timeout
	},
	unlock: function(callback) {
		callback();
	},
	lockTimeout: 100
};