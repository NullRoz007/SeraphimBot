var SeraBot = require('./dis');
var servermodule = require('./server');

console.log(servermodule);
//Start the server
console.log("Starting the server...")
var Server = new servermodule();
Server.Start();
Server.on('tokensupdate', function() {
	console.log("Update event triggered!");
});

//Start the Discord Bot.
console.log("Starting the Discord client...")
SeraBot.Start();