function Migration(details) {
	details = details || {};
	this.file = details.file;
	this.name = details.name;
	this.type = details.type;
	this.filename = details.filename;
	this.timestamp = details.timestamp;
	this.methods = details.methods;
}

module.exports = Migration;