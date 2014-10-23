module.exports.set = function(project, serializedState, callback) {
	project.storeState(serializedState, callback);
};

module.exports.get = function(project, callback) {
	project.fetchState(callback);
};