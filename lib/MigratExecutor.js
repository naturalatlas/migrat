var async = require('async');

module.exports = function(project, runlist, options, callback) {
	var context;

	async.series([
		function createContext(callback) {
			if (!project.context) {
				return callback();
			}
			project.context(function(err, _context) {
				context = _context;
				callback(err);
			});
		},
		function executeBeforeRunHook(callback) {
			if (!project.beforeRun) return callback(err);
			project.beforeRun(err, runlist, callback);
		},
		function executeRunList(callback) {
			async.eachSeries(runlist.items, function(item, callback) {
				async.series([
					function executeBeforeEachHook(callback) {
						if (!project.beforeEach) return callback();
						project.beforeEach(item, callback);
					},
					function executeItem(callback) {
						console.log(item.method + ': ' + item.migration.filename);
						item.migration.methods[item.method](context, callback);
					},
					function verifyItem(callback) {
						var check = item.migration.methods['check'];
						if (!check) return callback();
						check(context, callback);
					}
				], function(err) {
					if (!project.afterEach) return callback(err);
					project.afterEach(err, item, function() {
						callback(err);
					});
				});

			}, callback);
		}
	], function(err) {
		async.series([
			function executeAfterRunHook(callback) {
				if (!project.afterRun) return callback();
				project.afterRun(err, runlist, function() {
					callback();
				});
			},
			function rollBack(callback) {
				callback();
				// TODO: implement
				// if (err) { ... }
			}
		], function() {
			callback(err);
		});
	});
};