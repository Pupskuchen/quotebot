var links = require('./module');

exports.command = "findlink";

exports.desc = {
  params: "<string>",
  desc: "searches for in a link in the database",
  needed: "allowed"
};

exports.exec = function() {
  if(stringparam.length < 3) return paramError("findlink <string> (string must at least have 3 characters)");

  links.find(stringparam, function (err, rows) {
    if(err || rows.length < 1) {
      if(err) error("linkcollect", err);
      return chanMsg("couldn't find any link matching your search pattern");
    }

    var method = rows.length < 3 ? chanMsg : userMsg;

    chanMsg("I found "+rows.length+" entries matching your query");
    rows.forEach(function (link) {
      method(links.format(link, true));
    });
  });
};