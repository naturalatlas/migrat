var fs = require('fs');
var path = require('path');
var assert = require('chai').assert;

var index = 0;
var expectedStateKeys = [
	{
		before: {local: [], global: ['1414006573621-alreadyrun.js']},
		after: {local: [], global: ['1414006573621-alreadyrun.js']}
	},
	{
		before: {local: [], global: ['1414006573621-alreadyrun.js']},
		after: {local: [], global: ['1414006573621-alreadyrun.js','1414006573623-first.js']}
	},
	{
		before: {local: [], global: ['1414006573621-alreadyrun.js','1414006573623-first.js']},
		after: {local: [], global: ['1414006573621-alreadyrun.js','1414006573623-first.js','1414006573624-second.js']}
	},
	{
		before: {local: [], global: ['1414006573621-alreadyrun.js','1414006573623-first.js','1414006573624-second.js']},
		after: {local: ['1414006573625-third.all.js'], global: ['1414006573621-alreadyrun.js','1414006573623-first.js','1414006573624-second.js']}
	}
];

var stateFiles = {};
stateFiles['local'] = path.resolve(__dirname, '../../temp/write-states-project.local.migratdb');
stateFiles['global'] = path.resolve(__dirname, '../../temp/write-states-project.global.migratdb');

function checkState(hook, env) {
	var content = fs.readFileSync(stateFiles[env], 'utf8');
	var json = JSON.parse(content);
	var keys = Object.keys(json);
	assert.deepEqual(keys, expectedStateKeys[index][hook][env]);
}

function checkStates(hook, callback) {
	try {
		checkState(hook, 'local');
		checkState(hook, 'global');
	} catch (e) {
		return callback(e);
	}
	callback();
}

module.exports = {
	localState: stateFiles['local'],
	migrationsDir: './migrations',
	fetchState: function(callback) { callback(null, '{"1414006573621-alreadyrun.js":1414006573621}'); },
	storeState: function(state, callback) {
		fs.writeFile(stateFiles['global'], state, 'utf8', callback);
	},
	beforeEach: function(item, callback) {
		checkStates('before', callback);
	},
	afterEach: function(err, item, callback) {
		checkStates('after', function(err) {
			index++;
			callback(err);
		});
	}
};