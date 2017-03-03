const fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var querystring = require('querystring');
var sha1 = require('sha1');
var util = require('util');
var https = require('https');
var request = require('request');
var app = express();
var Destiny = require('./destiny-client');

module.exports = {
	Start: function(){
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));
		app.use('/home', express.static('/home'));

		var routes = require('./routes/routes')(app);
		
		https.createServer({
			key: fs.readFileSync('key.pem'),
			cert: fs.readFileSync('cert.pem')
		},app).listen(3000);
		
		var server = app.listen(8080, function() {
			console.log("Listening on port: %s", server.address().port);
		});
	}
}
app.get('/image/:filename', function(req, res){
	return res.sendFile(__dirname + "/home/"+req.params['filename']);
});

app.get('/authenticate', function(req, res){
	console.log(req);
	//get the code query:
	var code = req.query['code'];
	console.log("GOT AUTH CODE: "+code);
	
	//create our object to send to bungie:
	var codeObject = {"code": code};
	
	//request an AccessToken:
	request.post({
		headers: {
			'X-API-KEY': 'af70e027a7694afc8ed613589bf04a60',
		},
		url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromCode/',
		body: JSON.stringify(codeObject)
	}, function(error, response, httpBody){
		
		var json = JSON.parse(httpBody);
		var accessToken = String(json.Response.accessToken.value);
		
		//now we need to grab the membershipId associated with the accessToken so we can update the links.json file:
		request({
			headers: {
				'X-API-KEY': 'af70e027a7694afc8ed613589bf04a60',
				'Authorization': 'Bearer '+accessToken
			},
			url: 'https://www.bungie.net/Platform/User/GetCurrentBungieNetUser/'
		}, function(error, response, httpbody){
			if(!error){
				console.log(httpbody);
				var userJson = JSON.parse(httpbody);
				
				var displayName = String(userJson.Response.displayName);
				
				//so userJson.membershipId is not the same as membershipId in GetAccount, and other endpoints so 
				//I'll revert back to destiny-client and do a search to return the real one:
				
				var destiny = Destiny("af70e027a7694afc8ed613589bf04a60");
				destiny.Search({
					membershipType: 2,
					name: displayName
				}).then(res => {
					var user = res[0];
					console.log(user);
					var membershipId = user.membershipId;
					var linked_users = [];
					fs.exists("home/links.json", function(exists){
						if(exists){
							console.log("1");
							fs.readFile('home/links.json', (err, data) => {
								console.log("2")
								var arrayObject = JSON.parse(data);
								linked_users = arrayObject;
								for(i = 0; i < linked_users.length; i++){
									var linker = linked_users[i];
									if(linker.destinyId == membershipId){
										console.log("AYY?");
										linker.token = accessToken;
										linked_users[i] = linker;
									}
								}
								console.log('Updating links JSON');
								try{
									console.log("3")
									var jsonString = JSON.stringify(linked_users);
									fs.writeFile("home/links.json", jsonString);
								}
								catch(err){
									console.log(err);
								}
							});
			
						}
						else{
							console.log("Link file does not exist.");
						}
		
					});
					
				});
				
			}
			else{
				console.log(error);
			}
		});
	});
	return res.send("Authenticated!");
});


/*app.get('/groups/', function(req, res){
	return res.send(JSON.stringify(events));
});
app.get('/links/', function(req, res){
	return res.send(JSON.stringify(linked_users));
});
app.get('/groups/:groupId', function(req, res){
	var id = req.params['groupId'];

	var reqevent = events.find(x => x.id == id);
	return res.end(JSON.stringify(reqevent));
	
	
});*/
/*app.get('/groups/:groupId/detail', function(req, res){
	var reqid = req.params['groupId'];
	var reqevent = events.find(x => x.id == reqid);
	var output = reqevent.name + " - " +reqevent.creator + "\nPlayers:\n";
	for(i = 0; i < reqevent.players.length; i++){
		output += "\n"+reqevent.players[i].user.username;
	}
	return res.end(output);
});
app.get('/destiny/link/:DiscordName/:DestinyID', function(req, res){
	var DiscordName = req.params['DiscordName'];
	var DestinyID = req.params['DestinyID'];
	
	var linker = {discordName: DiscordName, destinyId: DestinyID};
	console.log(linker);
	linked_users.push(linker);	
	for(i = 0; i < client.channels.array().length; ++i){
		if(client.channels.array()[i].name == "general")
		{
			client.channels.array()[i].sendMessage("Manual Destiny <-> Discord Link Successful!");
			
		}
		
	}
	updateLinksJSON();	
});*/
