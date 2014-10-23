var assert = require('chai').assert;
var MigratState = require('../lib/MigratState.js');
var MigratMigration = require('../lib/MigratMigration.js');

describe('MigratState', function() {
	describe('.add()', function() {
		it('should add entry', function() {
			var state = new MigratState();
			var migration = new MigratMigration({filename: '1414006573678-UPPERCASE.js'});
			state.add(migration);
			assert.property(state.state, '1414006573678-uppercase.js');
			assert.notProperty(state.state, '1414006573678-UPPERCASE.js');
			assert.isNumber(state.state['1414006573678-uppercase.js']);
		});
		it('should throw if not a MigratMigration instance', function() {
			var state = new MigratState();
			assert.throws(function() {
				state.add({filename: '1414006573678-valid.js'});
			}, /MigratMigration/);
		});
	});
	describe('.remove()', function() {
		it('should remove entry', function() {
			var state = new MigratState({'1414006573678-uppercase.js': 1414006573678});
			assert.property(state.state, '1414006573678-uppercase.js');

			var migration = new MigratMigration({filename: '1414006573678-UPPERCASE.js'});
			state.remove(migration);
			assert.notProperty(state.state, '1414006573678-uppercase.js');
		});
		it('should throw if not a MigratMigration instance', function() {
			var state = new MigratState();
			assert.throws(function() {
				state.remove({filename: '1414006573678-valid.js'});
			}, /MigratMigration/);
		});
	});
	describe('.exists()', function() {
		it('should return true if entry found (case-insensitive)', function() {
			var state = new MigratState({'1414006573678-uppercase.js': 1414006573678});
			var migration = new MigratMigration({filename: '1414006573678-UPPERCASE.js'});
			assert.isTrue(state.exists(migration));
		});
		it('should return false if entry not found', function() {
			var state = new MigratState({'1414006573678-somethingelse.js': 1414006573678});
			var migration = new MigratMigration({filename: '1414006573678-valid.js'});
			assert.isFalse(state.exists(migration));
		});
		it('should throw if not a MigratMigration instance', function() {
			var state = new MigratState();
			assert.throws(function() {
				state.exists({filename: '1414006573678-valid.js'});
			}, /MigratMigration/);
		});
	});
	describe('.serialize()', function() {
		it('should return valid JSON string', function() {
			var state;

			state = new MigratState();
			assert.equal(state.serialize(), '{}');
			state = new MigratState({'1414006573678-valid.js': 1414006573678});
			assert.equal(state.serialize(), '{"1414006573678-valid.js":1414006573678}');
		});
	});
	describe('.unserialize()', function() {
		it('should return MigratState object', function() {
			var state;
			state = MigratState.unserialize('null');
			assert.instanceOf(state, MigratState);
			assert.deepEqual(state.state, {});

			state = MigratState.unserialize(null);
			assert.instanceOf(state, MigratState);
			assert.deepEqual(state.state, {});

			state = MigratState.unserialize('{}');
			assert.instanceOf(state, MigratState);
			assert.deepEqual(state.state, {});

			state = MigratState.unserialize('{"1414006573678-valid.js":1414006573678}');
			assert.instanceOf(state, MigratState);
			assert.deepEqual(state.state, {'1414006573678-valid.js': 1414006573678});
		});
	});
});