var _ = require('lodash');
var async = require('async');
var MigratProject = require('../MigratProject.js');
var MigratPlanner = require('../MigratPlanner.js');
var MigratExecutor = require('../MigratExecutor.js');
var MigratStateStore = require('../MigratStateStore.js');

function lockCallback(timeout, callback) {
	if (timeout <= 0) return callback;
	callback = _.once(callback);

	var _timeout = setTimeout(function() {
		callback(new Error('Timeout limit reached (' + timeout + 's)'));
	}, timeout * 1000);
	return callback;
};

module.exports = function(action, config, options, callback) {
	// initialize the project
	var project = new MigratProject(config);
	var store = new MigratStateStore(project);
	var lockAcquired = false;
	var states, plan;

	async.series([
		function acquireLock(callback) {
			if (options.dryRun || !project.lock) {
				return callback();
			}
			project.lock(lockCallback(project.lockTimeout, function(err) {
				lockAcquired = !err;
				callback(err);
			}));
		},
		function loadState(callback) {
			store.readState(function(err, _states) {
				states = _states;
				callback(err);
			});
		},
		function createMigrationPlan(callback) {
			var planner = MigratPlanner[action];
			planner(project, states, options, function(err, _runlist) {
				runlist = _runlist;
				callback(err);
			});
		},
		function executePlan(callback) {
			if (options.dryRun) {
				MigratRunListPrinter(project, runlist, options, callback);
			} else {
				MigratExecutor(project, runlist, options, callback);
			}
		}
	], function(err) {
		async.series([
			function releaseLock(callback) {
				if (!lockAcquired) return callback();
				project.releaseLock(lockCallback(project.lockTimeout, callback));
			}
		], function(err) {
			if (err) {
				console.error(err.message || err);
				process.exit(1);
			} else {
				process.exit(0);
			}
		});
	});
};