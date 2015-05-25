var movies = require("./module");

exports.command = "addmovie";

exports.desc = {
    params: "<string>",
    desc: "adds a movie to the database",
    needed: "allowed"
};

exports.exec = function () {
    var title = raw.substring(this.command.length+1);

    movies.add(title, nick, function (error, movietitle) {
        if (error) {
            log("error", error);
            return chanMsg("Sorry, but I couldn't add your movie :(");
        }

        return chanMsg("Movie '" + movietitle + "' successfully added!");
    });
};

