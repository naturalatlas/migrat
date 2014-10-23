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
});