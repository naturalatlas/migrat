function hasRun(migration, state_global, state_local) {
	if (migration.type === 'all') {
		return state_local.exists(migration);
	} else {
		return state_global.exists(migration);
	}
}

function sortMigrations(migrations) {
	return _.sortBy(migrations, 'timestamp');
}

/**
 * Reverts migrations by calling the down
 * method down to a certain point (exculsive).
 *
 * Options:
 *    - to (filename) REQUIRED
 *
 * @param {MigratProject} project
 * @param {MigratState} state_global
 * @param {MigratState} state_local
 * @param {object} options
 * @param {function} callback
 * @return {void}
 */
module.exports.down = function(project, state_global, state_local, options, callback) {
	if (!options.to) {
		return callback(new Error('The down method requires the "to" option'));
	}

	MigratReader.dir(project.migrationsDir, function(err, migrations) {
		migrations = sortMigrations(migrations);
		migration.reverse();

		// compute the runlist
		var reached_limit = false;
		var runlist = new MigratRunList();
		migrations.forEach(function(migration) {
			if (migration.filename === options.to) {
				reached_limit = true;
				return false;
			}
			if (hasRun(migration, state_global, state_local)) {
				runlist.push('down', migration);
			} else {
				runlist.push('skip', migration);
			}
		});

		// safety checks
		if (options.to && !reached_limit) {
			return callback(new Error('The specified "to" was not found: ' + options.to));
		}

		return callback(null, runlist);
	});
};

/**
 * Performs migrations in a forward direction,
 * up to a certain point if provided (inclusive).
 *
 * Options:
 *    - to (filename)
 *
 * @param {MigratProject} project
 * @param {MigratState} state_global
 * @param {MigratState} state_local
 * @param {object} options
 * @param {function} callback
 * @return {void}
 */
module.exports.up = function(project, state_global, state_local, options, callback) {
	MigratReader.dir(project.migrationsDir, function(err, migrations) {
		migrations = sortMigrations(migrations);

		// compute the runlist
		var reached_limit = false;
		var runlist = new MigratRunList();
		migrations.forEach(function(migration) {
			if (options.to && migration.filename === options.to) {
				reached_limit = true;
			}
			if (!hasRun(migration, state_global, state_local)) {
				runlist.push('up', migration);
			} else {
				runlist.push('skip', migration);
			}
			if (reached_limit) return false;
		});

		// safety checks
		if (options.to && !reached_limit) {
			return callback(new Error('The specified "to" was not found: ' + options.to));
		}

		return callback(null, runlist);
	});
};