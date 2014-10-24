var initializeCalled = false;
var terminateCalled = false;

module.exports = {
	localState: '../../temp/initialize-project.migratdb',
	migrationsDir: './migrations',
	fetchState: function(callback) { callback(null, '{}'); },
	storeState: function(state, callback) { callback(); },
	initialize: function(callback) {
		console.log('called:initialize');
		initializeCalled = true;
		callback();
	},
	lock: function(callback) {
		if (!initializeCalled) {
			return callback(new Error('The "initialize" method was not called early enough'));
		}
		callback();
	},
	beforeRun: function(runlist, callback) {
		if (!initializeCalled) {
			return callback(new Error('The "initialize" method was not called in time'));
		}
		callback();
	},
	afterRun: function(err, runlist, callback) {
		if (terminateCalled) {
			return callback(new Error('The "terminate" method was called too early'));
		}
		callback();
	},
	unlock: function(callback) {
		if (terminateCalled) {
			return callback(new Error('The "terminate" method was called too early'));
		}
		callback();
	},
	terminate: function(callback) {
		terminateCalled = true;
		console.log('called:terminate');
		callback();
	}
};