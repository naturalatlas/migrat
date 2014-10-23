var MigratMigration = require('../../lib/MigratMigration.js');
var MigratReader = require('../../lib/MigratReader.js');

module.exports = function(file) {
	var details = MigratReader.fileDetails(file);
	details.methods = {
		up: function(context, callback) { callback(); },
		down: function(context, callback) { callback(); },
		check: function(context, callback) { callback(); }
	};
	return new MigratMigration(details);
};