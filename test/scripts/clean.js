var fs = require('fs-extra');
var path = require('path');
var error = function(err) {
	console.log(err.message || er);
	process.exit(1);
}

var tempdir = path.resolve(__dirname, '../temp');
fs.remove(tempdir, function(err) {
	if (err) return error(err);
	fs.mkdirs(tempdir, function(err) {
		if (err) return error(err);
		process.exit(0);
	});
});