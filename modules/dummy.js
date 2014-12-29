exports.command = "command"; // the command

exports.desc = {
	params: "parameter", // parameters (shown in help)
	desc: "a nice, short description about what this module does", // command description (shown in help)
	needed: "" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

// to be executed on command
exports.exec = function() {

};

/*
// "destructor"
exports.stop = function() {

};
*/