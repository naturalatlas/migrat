function Migration(details) {
	this.file = details.file;
	this.timestamp = details.timestamp;
	this.type = details.type;
	this.methods = details.methods;
}

module.exports = Migration;