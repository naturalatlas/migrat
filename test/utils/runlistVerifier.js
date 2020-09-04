var assert = require('chai').assert;
var MigratRunList = require('../../lib/MigratRunList.js');

module.exports = function(done, expected_results) {
	var methods_expected = expected_results.map(v => v[0]);
	var filenames_expected = expected_results.map(v => v[1]);

	return function(err, runlist) {
		assert.isNull(err);
		assert.instanceOf(runlist, MigratRunList);
		assert.isArray(runlist.items);

		var migrations = runlist.items.map(v => v.migration);
		var methods = runlist.items.map(v => v.method);
		var filenames = runlist.items.map(v => v.filename);
		var results = runlist.items.map(function(item) {
			return [item.method, item.migration.filename];
		});

		assert.deepEqual(results, expected_results);
		done();
	};
};
