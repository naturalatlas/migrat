var fs = require('fs');
var path = require('path');

module.exports = {
	localState: '../../temp/unlock-timeout-project.migratdb',
	migrationsDir: './migrations',
	fetchState: function(callback) { callback(null, '{}'); },
	storeState: function(state, callback) { callback(); },
	lock: function(callback) {
		throw new Error('Lock shouldn\'t have been called');
	},
	unlock: function(callback) {
		fs.unlink(path.resolve(__dirname, '../../temp/unlock-locked.lock'), callback);
	},
	lockTimeout: 100,
	initialize: function(callback) {
		console.log('called:initialize');
		callback();
	},
	terminate: function(callback) {
		console.log('called:terminate');
		callback();
	},
	plugins: [
		function(migrat) {
			migrat.registerHook('initialize', function(callback) {
				console.log('called:plugin_initialize');
				callback();
			});
			migrat.registerHook('terminate', function(callback) {
				console.log('called:plugin_terminate');
				callback();
			});
		}
	]
};