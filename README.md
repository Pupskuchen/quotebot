# node.js IRC bot

This is an irc bot made in node.js.
It was originally made so irc users could save quotes of each other.
Anyway I've added the feature to add modules to make it more dynamic and now you can do basically everything with it very easily.


## Example config

```json
{
  "server": {
    "host": "irc.thepups.net",
    "port": 6697,
    "ssl":  true,
    "allow_invalid_ssl": true,
    "chans": [
      "#neuland"
    ]
  },

  "client": {
    "nick": "quoteBot",
    "user": "quoteBot",
    "real": "quoteBot",
    "pass": "",
    "nickserv": {
      "user": "quoteBotUser",
      "pass": "supersecure"
    }
  },

  "kick_autorejoin": true,

  "log": true,
  "commandchar": ["!"],

  "modules": [
    "time",
    "say",
    "movie"
  ],

  "allowbyaccount": true,
  "allowed": [
    "admin"
  ]
}
```

The configuration is pretty easy and self-explanatory.

Use ```allow_invalid_ssl``` to connect to irc networks/servers with invalid/self-signed or expired ssl certificates.

```chans``` can be empty or left out if you don't want the bot to join any channel.

```nickserv``` is optional. If nickserv is configured and ```nickserv.user``` is unset, it will use the client's nick as nickserv user.

You can define multiple command characters that the bot will check.

There are three steps of permission. First, a user who is not logged in. Second, a user who is logged in. And then there's the owner.
The owner is always the first person in the ```allowed``` array. There's only one.

```allowbyaccount``` can be set to true if you want every user who's logged in to be allowed to use the commands that are specified as for allowed users.
If you set it to false, only users in the ```allowed``` array will be able to use these commands.


### Modules

##### Small Modules

Small modules can be included by file name (with or without .js). They are designed to consist of one command and should basically look like this:
```javascript
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
// "destructor" - only needed if something needs to be stopped when unloading the module (e.g. a timer/an interval)
exports.stop = function() {

};
*/
```

##### Large Modules

Large modules (like the movie-module) which use their own directory can be loaded by adding the directory to the list.
node.js will look for an index.js in that directory. That index.js should look like this:
```javascript
exports.subdeps = [
  'module'
];
exports.components = [
  'add',
  'find',
  'info',
  'list',
  'rate'
];
```
subdeps are dependencies of the components which should be reloaded when reloading the configuration and modules of quotebot.
components contains the ...components of your module - which can be small modules or imbiber plugins.

##### "imbiber" plugins

These plugins are made for features that do not need a command because the run the whole time or whatever a dev would like to do.
You can do whatever you want to do in it. If you do something that needs to be stopped when the plugin gets unloaded, you need to add a kill-command:
```javascript
exports.kill = function () {
  // for example clearInterval(interval);
};
```

##### Modules/Plugins Generally

Every small module/imbiber plugin (large modules don't need that because they consist of small modules) has the following attributes/functions:
```javascript
log(type, msg); // log something, only if log is true in the config
error(type, msg); // outputs error, always
client; // coffea client variable (can be used to add event listeners or whatever you want to)
db // the sqlite database of quotes;
c // the config;
```
Small modules also get attributes when their command is executed. See quotebot.js to see which, most of them are self-explanatory. If you need help, contact me (see support).
You could need these when coding your module/plugin.

## Support

If you need help, feel free to join us on IRC. Details are in the example config.