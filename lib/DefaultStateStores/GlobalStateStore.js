var MigratStateStore = require('../MigratStateStore.js');

module.exports = function(project) {
	return MigratStateStore.define({
		get: function(callback) {
			if (!project.fetchState) {
				return callback(new Error('Migrat project missing "fetchState" option in config'));
			}
			project.fetchState(callback);
		},
		set: function(serializedState, callback) {
			if (!project.storeState) {
				return callback(new Error('Migrat project missing "storeState" option in config'));
			}
			project.storeState(serializedState, callback);
		}
	});
};