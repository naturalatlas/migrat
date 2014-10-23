var async = require('async');

module.exports = function MigratExecutor(project, runlist, options, callback) {
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
			if (!project.beforeRun) return callback();
			project.beforeRun(runlist, callback);
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
						if (item.method !== 'skip') {
							item.migration.methods[item.method](context, callback);
						} else {
							callback();
						}
					},
					function verifyItem(callback) {
						var check = item.migration.methods['check'];
						if (!check || item.method === 'skip') return callback();
						check(context, callback);
					}
				], function(err) {
					if (!project.afterEach) return callback(err);
					project.afterEach(err || null, item, function() {
						callback(err);
					});
				});

			}, callback);
		}
	], function(err) {
		async.series([
			function executeAfterRunHook(callback) {
				if (!project.afterRun) return callback();
				project.afterRun(err || null, runlist, function() {
					callback();
				});
			},
			function rollBack(callback) {
				callback();
				// TODO: implement
				// if (err && project.rollbackOnError) { ... }
			}
		], function() {
			callback(err);
		});
	});
};