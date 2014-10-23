var _ = require('lodash');
var path = require('path');
var assert = require('chai').assert;
var exec = require('child_process').exec;
var bin = 'node ' + path.resolve(__dirname, '../bin/migrat');

describe('CLI', function() {
	it('it should resolve "migrationsDir" relative to config file', function(done) {
		var projectDir = path.resolve(__dirname, './fixtures/valid-project');
		var configFile = projectDir + '/migrat.config.js';
		exec(bin + ' up --dry-run --json -c ' + configFile, function(err, stdout, stderr) {
			assert.isNull(err);
			assert.equal(stdout.trim(), '[["up","1414006573623-first.js"]]');
			done();
		});
	});
	it('it should resolve "localState" relative to config file', function() {

	});
	it('it should error if "lock" times out', function(done) {
		var projectDir = path.resolve(__dirname, './fixtures/lock-timeout-project');
		var configFile = projectDir + '/migrat.config.js';
		exec(bin + ' up -c ' + configFile, function(err, stdout, stderr) {
			assert.instanceOf(err, Error);
			assert.match(err.message, /Lock timeout limit/);
			done();
		});
	});
	it('it should error if "unlock" times out', function(done) {
		var projectDir = path.resolve(__dirname, './fixtures/unlock-timeout-project');
		var configFile = projectDir + '/migrat.config.js';
		exec(bin + ' up -c ' + configFile, function(err, stdout, stderr) {
			assert.instanceOf(err, Error);
			assert.match(err.message, /Unlock timeout limit/);
			done();
		});
	});
});