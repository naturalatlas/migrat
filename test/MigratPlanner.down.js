var _ = require('lodash');
var assert = require('chai').assert;
var MigratProject = require('../lib/MigratProject.js');
var MigratPlanner = require('../lib/MigratPlanner.js');
var MigratState = require('../lib/MigratState.js');
var runlistVerifier = require('./utils/runlistVerifier.js');

describe('MigratPlanner', function() {
	describe('.down()', function(done) {
		it('should return error if migrations cannot be read', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/doesnotexist'});
			var mockLocalState = new MigratState({});
			var mockGlobalState = new MigratState({});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {to: 'something'}, function(err, runlist) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /ENOENT/);
				done();
			});
		});
		it('should return error if "to" argument is missing', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/fixtures/valid'});
			var mockLocalState = new MigratState({});
			var mockGlobalState = new MigratState({});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {}, function(err, runlist) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /The down method requires the "to" option/);
				done();
			});
		});
		it('should return error if "to" argument invalid', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/fixtures/valid'});
			var mockLocalState = new MigratState({});
			var mockGlobalState = new MigratState({});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {to: '1414006573678-doesnotexist.js'}, function(err, runlist) {
				assert.instanceOf(err, Error);
				assert.match(err.message, /was not found/);
				done();
			});
		});
		it('should return empty runlist for projects w/o any current state', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/fixtures/valid'});
			var mockLocalState = new MigratState({});
			var mockGlobalState = new MigratState({});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {to: '1414006573623-first.js'}, runlistVerifier(done, [
				['skip', '1414006573700-fourth.js'],
				['skip', '1414006573679-third.all.js'],
				['skip', '1414006573678-second.js']
			]));
		});
		it('should return full runlist if all have been run before', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/fixtures/valid'});
			var mockLocalState = new MigratState({
				'1414006573679-third.all.js': 1414006573679
			});
			var mockGlobalState = new MigratState({
				'1414006573623-first.js': 1414006573623,
				'1414006573678-second.js': 1414006573678,
				'1414006573700-fourth.js': 1414006573700,
			});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {to: '1414006573623-first.js'}, runlistVerifier(done, [
				['down', '1414006573700-fourth.js'],
				['down', '1414006573679-third.all.js'],
				['down', '1414006573678-second.js']
			]));
		});
		it('should return correct runlist when a node is partially migrated (simple)', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/fixtures/valid'});
			var mockLocalState = new MigratState({});
			var mockGlobalState = new MigratState({
				'1414006573678-second.js': 1414006573678,
				'1414006573700-fourth.js': 1414006573700
			});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {to: '1414006573623-first.js'}, runlistVerifier(done, [
				['down', '1414006573700-fourth.js'],
				['skip', '1414006573679-third.all.js'],
				['down', '1414006573678-second.js']
			]));
		});
		it('should return correct runlist when a migration has been executed on another node, but not the current', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/fixtures/valid'});
			var mockLocalState = new MigratState({});
			var mockGlobalState = new MigratState({
				'1414006573678-second.js': 1414006573678,
				'1414006573700-fourth.js': 1414006573700,
				'1414006573679-third.all.js': 1414006573679 // it should ignore this
			});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {to: '1414006573623-first.js'}, runlistVerifier(done, [
				['down', '1414006573700-fourth.js'],
				['skip', '1414006573679-third.all.js'],
				['down', '1414006573678-second.js']
			]));
		});
		it('it should return corrent runlist when containing a migration that has already run locally', function(done) {
			var mockProject = new MigratProject({migrationsDir: __dirname + '/fixtures/valid'});
			var mockLocalState = new MigratState({
				'1414006573679-third.all.js': 1414006573679
			});
			var mockGlobalState = new MigratState({
				'1414006573678-second.js': 1414006573678,
				'1414006573700-fourth.js': 1414006573700,
			});
			MigratPlanner.down(mockProject, mockGlobalState, mockLocalState, {to: '1414006573623-first.js'}, runlistVerifier(done, [
				['down', '1414006573700-fourth.js'],
				['down', '1414006573679-third.all.js'],
				['down', '1414006573678-second.js']
			]));
		});
	});
});