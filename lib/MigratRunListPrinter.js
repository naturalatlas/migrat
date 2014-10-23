module.exports = function(project, runlist, options, callback) {
	runlist.items.forEach(function(item) {
		console.log(item.method + ': ' + item.migration.filename);
	});
	callback();
};