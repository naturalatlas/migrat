var _ = require('lodash');
var assert = require('chai').assert;
var MigratRunList = require('../lib/MigratRunList.js');
var MigratMigration = require('../lib/MigratMigration.js');

describe('MigratRunList', function() {
	describe('.push()', function() {
		it('should throw if "migration" argument invalid', function() {
			var runlist = new MigratRunList();
			assert.throws(function() { runlist.push('up'); }, /Migration not a MigratMigration instance/);
			assert.throws(function() { runlist.push('up', null); }, /Migration not a MigratMigration instance/);
			assert.throws(function() { runlist.push('up', {}); }, /Migration not a MigratMigration instance/);
		});
		it('should throw if "method" argument invalid', function() {
			var migration = new MigratMigration();
			var runlist = new MigratRunList();
			assert.throws(function() { runlist.push(null, migration); }, /Invalid migration method/);
			assert.throws(function() { runlist.push('invalid', migration); }, /Invalid migration method/);
		});
	});
});