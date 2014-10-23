module.exports = {
	localState: './migrations/.migratdb',
	migrationsDir: './migrations',
	fetchState: function(callback) { callback(null, '{}'); },
	storeState: function(state, callback) { callback(); },
};