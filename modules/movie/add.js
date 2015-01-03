var movies = require('./index.js');

exports.command = "addmovie"; // the command

exports.desc = {
    params: "<string>", // parameters (shown in help)
    desc: "adds a movie to the database", // command description (shown in help)
    needed: "allowed" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

exports.exec = function () {
    var title = raw.substring(this.command.length+1);

    movies.add(title, nick, function (error) {
        if (error) {
            console.log(error);
            return chanMsg("Sorry, but I couldn't add your movie :(");
        }

        return chanMsg("Movie '" + title + "' successfully added!");
    });
};

