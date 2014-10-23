module.exports.set = function(project, serializedState, callback) {
	if (!project.storeState) {
		return callback(new Error('Migrat project missing "storeState" option in config'));
	}
	project.storeState(serializedState, callback);
};

module.exports.get = function(project, callback) {
	if (!project.fetchState) {
		return callback(new Error('Migrat project missing "fetchState" option in config'));
	}
	project.fetchState(callback);
};