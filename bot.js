var Sera = require('./server');
//Start the server
console.log("Starting the server...")
var Server = new Sera.Server();
Server.Start();

console.log("Starting the Discord client...")
//wait for the config file to be decrypted:
Server.on('auth', function() {
	var SeraBot = require('./dis');
	//Bot names are main/secondary:
	SeraBot.Start("main");
	SeraBot.Start("secondary");
});

