var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var assert = require('chai').assert;
var exec = require('child_process').exec;
var bin = 'node ' + path.resolve(__dirname, '../bin/migrat');

describe('CLI', function() {
	describe('"create" command', function() {
		it('should use "migrationTemplate" option if present in config', function(done) {
			var projectDir = path.resolve(__dirname, './fixtures/custom-create-project');
			var configFile = projectDir + '/migrat.config.js';

			exec(bin + ' create test -c ' + configFile, {env: {USER: 'testuser'}}, function(err, stdout, stderr) {
				assert.isNull(err);
				assert.match(stdout, /\d{13}\-test\.js/);
				var filename = stdout.match(/\d{13}\-test\.js/)[0];
				var file = __dirname + '/temp/' + filename;
				var timestamp = filename.match(/\d+/)[0];
				assert.isTrue(fs.existsSync(file));

				var content_expected = 'details:{"user":"testuser","timestamp":' + timestamp + ',"filename":"' + timestamp + '-test.js"}';
				var content_actual = fs.readFileSync(file, 'utf8').trim();
				assert.equal(content_expected, content_actual);
				done();
			});
		});
		it('should use plugin-defined templates when given the --type argument', function(done) {
			var projectDir = path.resolve(__dirname, './fixtures/plugin-create-project');
			var configFile = projectDir + '/migrat.config.js';

			exec(bin + ' create test --type ext -c ' + configFile, {env: {USER: 'testuser'}}, function(err, stdout, stderr) {
				assert.isNull(err);
				assert.match(stdout, /\d{13}\-test\.ext/);
				var filename = stdout.match(/\d{13}\-test\.ext/)[0];
				var file = __dirname + '/temp/' + filename;
				var timestamp = filename.match(/\d+/)[0];
				assert.isTrue(fs.existsSync(file));

				var content_expected = 'hello, testuser';
				var content_actual = fs.readFileSync(file, 'utf8');
				assert.equal(content_expected, content_actual);
				done();
			});
		});
	});
	describe('"up", "down" commands', function() {
		it('should call "initialize" first, and "terminate" at end', function(done) {
			var projectDir = path.resolve(__dirname, './fixtures/initialize-project');
			var configFile = projectDir + '/migrat.config.js';
			exec(bin + ' up -c ' + configFile, function(err, stdout, stderr) {
				assert.isNull(err);
				assert.match(stdout, /called:initialize/);
				assert.match(stdout, /called:terminate/);
				done();
			});
		});
		it('should resolve "migrationsDir" relative to config file', function(done) {
			var projectDir = path.resolve(__dirname, './fixtures/valid-project');
			var configFile = projectDir + '/migrat.config.js';
			exec(bin + ' up --dry-run --json -c ' + configFile, function(err, stdout, stderr) {
				assert.isNull(err);
				assert.equal(stdout.trim(), '[["up","1414006573623-first.js"]]');
				done();
			});
		});
		it('should resolve "localState" relative to config file', function(done) {
			var projectDir = path.resolve(__dirname, './fixtures/valid-project');
			var configFile = projectDir + '/migrat.config.js';
			exec(bin + ' up -c ' + configFile, function(err, stdout, stderr) {
				assert.isTrue(fs.existsSync(__dirname + '/temp/valid-project.migratdb'));
				done();
			});
		});
		it('should error if "lock" times out', function(done) {
			var projectDir = path.resolve(__dirname, './fixtures/lock-timeout-project');
			var configFile = projectDir + '/migrat.config.js';
			exec(bin + ' up -c ' + configFile, function(err, stdout, stderr) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /Lock timeout limit/);
				done();
			});
		});
		it('should error if "unlock" times out', function(done) {
			var projectDir = path.resolve(__dirname, './fixtures/unlock-timeout-project');
			var configFile = projectDir + '/migrat.config.js';
			exec(bin + ' up -c ' + configFile, function(err, stdout, stderr) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /Unlock timeout limit/);
				done();
			});
		});
		it('should write state immediately after each successful migration', function(done) {
			// the majority of this test happens in the project config
			var projectDir = path.resolve(__dirname, './fixtures/write-states-project');
			var configFile = projectDir + '/migrat.config.js';
			exec(bin + ' up -c ' + configFile, function(err, stdout, stderr) {
				assert.isNull(err);
				done();
			});
		});
	});
	describe('"unlock" command', function() {
		it('should unlock a locked project', function(done) {
			var lockFile = __dirname + '/temp/unlock-locked.lock';
			fs.writeFileSync(lockFile, '', 'utf8');
			assert.isTrue(fs.existsSync(lockFile));
			var projectDir = __dirname + '/fixtures/unlock-lock-project';
			var configFile = projectDir + '/migrat.config.js';
			exec(bin + ' unlock -c ' + configFile, function(err, stdout, stderr) {
				assert.isNull(err);
				assert.isFalse(fs.existsSync(lockFile));
				assert.match(stdout, /called:initialize/);
				assert.match(stdout, /called:terminate/);
				assert.match(stdout, /called:plugin_initialize/);
				assert.match(stdout, /called:plugin_terminate/);
				done();
			});
		});
	});
});