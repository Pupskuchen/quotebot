var movies = require('./index.js');

exports.command = "movieinfo"; // the command

exports.desc = {
    params: "<string>", // parameters (shown in help)
    desc: "show information on a movie", // command description (shown in help)
    needed: "allowed" // needed permissions, can be an empty string, "allowed" or "owner" (used for help)
};

exports.exec = function () {
    var title = raw.substring(this.command.length+1);

    movies.find(title, 1, function (error, movie) {
        if (error || !movie) {
            return chanMsg("Sorry, but I couldn't find any movie :(");
        }

        chanMsg("{B}Movie Info for " + title + ":{R}");
        chanMsg(movies.format(movie));
    });
};

