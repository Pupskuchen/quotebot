var links = require('./module');

exports.command = "countlinks";

exports.desc = {
  params: "",
  desc: "tells you the amount of links in the database",
  needed: "allowed"
};

exports.exec = function() {
  links.count(function (err, links) {
    if(err) return chanMsg("something went wrong.");
    return chanMsg("There are {B}"+links.amount+"{R} links in the database.");
  });
};