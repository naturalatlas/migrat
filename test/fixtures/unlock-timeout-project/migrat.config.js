module.exports = {
	localState: '../../temp/unlock-timeout-project.migratdb',
	migrationsDir: './migrations',
	fetchState: function(callback) { callback(null, '{}'); },
	storeState: function(state, callback) { callback(); },
	lock: function(callback) {
		callback();
	},
	unlock: function(callback) {
		// never call callback to cause timeout
	},
	lockTimeout: 100
};