var fs = require('fs');
var MigratStateStore = require('../MigratStateStore.js');

module.exports = function(project) {
	return MigratStateStore.define({
		get: function(callback) {
			if (!project.localState) {
				return callback(new Error('Migrat project missing "localState" option in config'));
			}
			fs.readFile(project.localState, 'utf8', function(err, content) {
				if (err && err.code === 'ENOENT') {
					return callback(null, '{}');
				}
				callback(err, content);
			});
		},
		set: function(serializedState, callback) {
			if (!project.localState) {
				return callback(new Error('Migrat project missing "localState" option in config'));
			}
			fs.writeFile(project.localState, serializedState, 'utf8', callback);
		}
	});
};