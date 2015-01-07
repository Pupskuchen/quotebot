# node.js IRC bot

This is an irc bot made in node.js.
It was originally made so irc users could save quotes of each other.
Anyway I've added the feature to add modules to make it more dynamic and now you can do basically everything with it very easily.

### Example config

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

##### Modules

Modules can be included by file name (with or without .js). Large modules (like the movie-module) which use their own directory can be loaded by adding the directory to the list.
node.js will then look for an index.js in that directory. That index.js should look like this:
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
components contains the ...components of your module.


###### Support

If you need help, feel free to join us on IRC. Details are in the example config.