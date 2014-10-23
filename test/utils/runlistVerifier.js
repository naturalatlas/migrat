var _ = require('lodash');
var assert = require('chai').assert;
var MigratRunList = require('../../lib/MigratRunList.js');

module.exports = function(done, expected_results) {
	var methods_expected =_.pluck(expected_results, 0);
	var filenames_expected = _.pluck(expected_results, 1);

	return function(err, runlist) {
		assert.isNull(err);
		assert.instanceOf(runlist, MigratRunList);
		assert.isArray(runlist.items);

		var migrations = _.pluck(runlist.items, 'migration');
		var methods = _.pluck(runlist.items, 'method');
		var filenames = _.pluck(migrations, 'filename');
		var results = runlist.items.map(function(item) {
			return [item.method, item.migration.filename];
		});

		assert.deepEqual(results, expected_results);
		done();
	};
};