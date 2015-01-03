exports.command = "aww";

exports.desc = {
	params: "",
	desc: "Pulls the newest post off of /r/aww and prints it into the chat",
	needed: "allowed"
};

exports.exec = function() {
	reddit = require("redwrap");
	reddit.r('aww').new().limit(1).exe(function(err, data, res) {
		chanMsg("Newest /r/aww: " + data.data.children[0].data.title + " Direct link: " + data.data.children[0].data.url + " Comments: http://reddit.com" + data.data.children[0].data.permalink);
	});
};