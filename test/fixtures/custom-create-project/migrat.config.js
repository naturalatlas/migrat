module.exports = {
	localState: '../../temp/custom-create-project.migratdb',
	migrationsDir: '../../temp',
	fetchState: function(callback) { callback(null, '{}'); },
	storeState: function(state, callback) { callback(); },
	migrationTemplate: function(details, callback) {
       callback(null, 'details:' + JSON.stringify(details));
    },
};