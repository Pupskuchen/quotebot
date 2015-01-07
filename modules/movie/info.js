var movies = require('./module');

exports.command = "movieinfo";

exports.desc = {
    params: "<string>",
    desc: "show information on a movie",
    needed: "allowed"
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

