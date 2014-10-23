module.exports.set = function(project, serializedState, callback) {
	fs.writeFile(project.localState, serializedState, 'utf8', callback);
};

module.exports.get = function(project, callback) {
	fs.readFile(project.localState, 'utf8', callback);
};