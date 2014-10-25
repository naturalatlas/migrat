var assert = require('chai').assert;
var MigratProject = require('../lib/MigratProject.js');
var MigratState = require('../lib/MigratState.js');
var MigratStateStore = require('../lib/MigratStateStore.js');
var MigratPluginSystem = require('../lib/MigratPluginSystem.js');
var MockMigratMigration = require('./mocks/MockMigration.js');

describe('MigratPluginSystem', function() {
	describe('.getLockMethods()', function() {
		it('should return null if none registered', function() {
			var plugins = new MigratPluginSystem();
			assert.isNull(plugins.getLockMethods());
		});
		it('should return object with "lock", "unlock" functions when registered', function() {
			var lock = function() {};
			var unlock = function() {};

			var plugins = new MigratPluginSystem([
				function(migrat) {
					migrat.registerLocker({
						lock: lock,
						unlock: unlock
					});
				}
			]);

			var locker = plugins.getLockMethods();
			assert.isObject(locker);
			assert.equal(locker.lock, lock);
			assert.equal(locker.unlock, unlock);
		});
	});

	describe('.getGlobalStateStore()', function() {
		it('should return valid MigratStateStore instance if one found', function(done) {
			var setExecuted = false;
			var getExecuted = false;

			var migration = MockMigratMigration('1414046792583-plugintest.js');
			var plugins = new MigratPluginSystem([
				function(migrat) {
					migrat.registerGlobalStateStore({
						get: function(callback) {
							getExecuted = true;
							return callback(null, '{"1414046792583-plugintest.js":1414046792583}')
						},
						set: function(state, callback) {
							setExecuted = true;
							assert.equal(state, '{"1414046792583-plugintest2.js":1414046792583}');
							callback();
						}
					});
				}
			]);

			var store = plugins.getGlobalStateStore();
			assert.instanceOf(store, MigratStateStore);
			store.get(function(err, state) {
				assert.isNull(err);
				assert.isTrue(getExecuted);
				assert.instanceOf(state, MigratState);
				assert.isTrue(state.exists(migration));

				var state2 = new MigratState({'1414046792583-plugintest2.js': 1414046792583});
				store.set(state2, function(err) {
					assert.isNull(err);
					assert.isTrue(setExecuted);
					done();
				});
			});
		});
		it('should return null if none registered', function() {
			var plugins = new MigratPluginSystem();
			assert.isNull(plugins.getGlobalStateStore());
		});
	});

	describe('.getLocalStateStore()', function() {
		it('should return valid MigratStateStore instance if one found', function(done) {
			var setExecuted = false;
			var getExecuted = false;

			var migration = MockMigratMigration('1414046792583-plugintest.js');
			var plugins = new MigratPluginSystem([
				function(migrat) {
					migrat.registerLocalStateStore({
						get: function(callback) {
							getExecuted = true;
							return callback(null, '{"1414046792583-plugintest.js":1414046792583}')
						},
						set: function(state, callback) {
							setExecuted = true;
							assert.equal(state, '{"1414046792583-plugintest2.js":1414046792583}');
							callback();
						}
					});
				}
			]);

			var store = plugins.getLocalStateStore();
			assert.instanceOf(store, MigratStateStore);
			store.get(function(err, state) {
				assert.isNull(err);
				assert.isTrue(getExecuted);
				assert.instanceOf(state, MigratState);
				assert.isTrue(state.exists(migration));

				var state2 = new MigratState({'1414046792583-plugintest2.js': 1414046792583});
				store.set(state2, function(err) {
					assert.isNull(err);
					assert.isTrue(setExecuted);
					done();
				});
			});
		});
		it('should return null if none registered', function() {
			var plugins = new MigratPluginSystem();
			assert.isNull(plugins.getLocalStateStore());
		});
	});

	describe('.loadMigration()', function() {
		it('should return null to callback if no loaders registered', function(done) {
			var plugins = new MigratPluginSystem();
			plugins.loadMigration('/1414046792583-plugintest2.js', function(err, methods) {
				assert.isNull(err);
				assert.isNull(methods);
				done();
			});
		});
		it('should return null to callback if no matches found', function(done) {
			var plugins = new MigratPluginSystem([
				function(migrat) {
					migrat.registerLoader('*.sql', function(file, callback) {
						callback(null, {
							up: up,
							down: down,
							check: check
						});
					});
				}
			]);

			plugins.loadMigration('/path/to/1414046792583-plugintest2.saql', function(err, methods) {
				assert.isNull(err);
				assert.isNull(methods);
				done();
			});
		});
		it('should return object w/methods to callback if loader succeeds', function(done) {
			var loaderExecuted = false;
			var up = function() {};
			var down = function() {};
			var check = function() {};

			var plugins = new MigratPluginSystem([
				function(migrat) {
					migrat.registerLoader('*.sql', function(file, callback) {
						loaderExecuted = true;
						callback(null, {
							up: up,
							down: down,
							check: check
						});
					});
				}
			]);

			plugins.loadMigration('/path/to/1414046792583-plugintest2.sql', function(err, methods) {
				assert.isNull(err);
				assert.isTrue(loaderExecuted);
				assert.equal(methods.up, up);
				assert.equal(methods.down, down);
				assert.equal(methods.check, check);
				done();
			});
		});
	});

	describe('.getTemplateRenderer()', function() {
		it('should return null if no renderers exist', function() {
			var plugins = new MigratPluginSystem();
			assert.isNull(plugins.getTemplateRenderer('awf'));
		});
		it('should return bull if no types match', function() {
			var plugins = new MigratPluginSystem([
				function(migrat) {
					migrat.registerTemplate('awf', function(details, callback) {
						callback(null, details.message);
					});
				}
			]);
			assert.isNull(plugins.getTemplateRenderer('awf2'));
		});
		it('should return function if matching type exists', function() {
			var renderer = function() {};
			var plugins = new MigratPluginSystem([
				function(migrat) {
					migrat.registerTemplate('awf', renderer);
				}
			]);
			assert.equal(plugins.getTemplateRenderer('awf'), renderer);
		});
	});
});