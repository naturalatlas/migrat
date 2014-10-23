var fs = require('fs');

module.exports.set = function(project, serializedState, callback) {
	if (!project.localState) {
		return callback(new Error('Migrat project missing "localState" option in config'));
	}
	fs.writeFile(project.localState, serializedState, 'utf8', callback);
};

module.exports.get = function(project, callback) {
	if (!project.localState) {
		return callback(new Error('Migrat project missing "localState" option in config'));
	}
	fs.readFile(project.localState, 'utf8', function(err, content) {
		if (err && err.code === 'ENOENT') {
			return callback(null, '{}');
		}
		callback(err, content);
	});
};