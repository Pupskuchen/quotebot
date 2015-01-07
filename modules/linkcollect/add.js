var links = require('./module');

exports.command = "addlink";

exports.desc = {
	params: "<link> [<desc>]",
	desc: "add a link to the database",
	needed: "allowed"
};

exports.exec = function() {
  var link = params[0];
  var desc = paramstringparam ? paramstringparam : "none";

  if(!links.validURL(link)) return chanMsg("your link is not valid");
  links.add(nick, link, desc, function (err) {
    if(err) {
      error("linkcollect", err);
      return chanMsg("couldn't add link");
    }

    return chanMsg("added link #"+this.lastID);
  });
};