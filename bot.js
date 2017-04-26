var Sera = require('./server');
//Start the server
console.log("Starting the server...")
var Server = new Sera.Server();
Server.Start();

console.log("Starting the Discord client...")
//wait for an auth attempt:
Server.on('auth', function() {
	var SeraBot = require('./dis');
	//SeraBot.Start("main");
	SeraBot.Start("secondary");
});

