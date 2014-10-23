var MigratMigration = require('./MigratMigration.js');

function MigratRunList() {
	this.migrations = [];
}

MigratRunList.prototype.push = function(method, migration) {
	if (!(migration instanceof MigratMigration)) {
		throw new Error('Migration not a MigratMigration instance');
	}
	if (method !== 'up' && method !== 'down' && method !== 'skip') {
		throw new Error('Invalid migration method');
	}
	this.tasks.push({
		method: method,
		migration: migration
	});
};

module.exports = MigratRunList;