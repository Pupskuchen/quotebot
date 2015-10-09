var Cleverbot = require('cleverbot-node'),
    Entities = require('html-entities').AllHtmlEntities;


function handler(e) {
    if (e.message.toLowerCase().indexOf(client.me.getNick().toLowerCase() + ':') === 0) {
        cleverbot = new Cleverbot;
        entities = new Entities();
		
        var text = e.message.substr((client.me + ':').length).trim();
        Cleverbot.prepare(function() {
            cleverbot.write(text, function(response) {
                client.send(e.channel.getName(), e.user.getNick() + ": " + entities.decode(response.message));
            });
        });
    }
}

client.on('message', handler);

exports.kill = function() {
    client.removeListener('message', handler);
};