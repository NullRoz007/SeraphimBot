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
var EventEmitter = require("events").EventEmitter;
var util = require('util');
var encryptor = require('file-encryptor');
var Server = function(){
	var self = this;	
	EventEmitter.call(this);
}


//util.inherits(Server, EventEmitter);

Server.prototype.__proto__ = EventEmitter.prototype;

Server.prototype.Start = function() {
		var self = this;
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
		app.get('/authbot', function(req, res){
			console.log("GOT AUTH REQUEST");
			var password = req.query['p'];
			console.log(password);
			var file = fs.readFile('config', function(error, data){
				if(error) throw error;
				encryptor.decryptFile('config', 'config.json', password, function(err){
					if(err) throw error;
					self.emit('auth');
				});
				
			});
			
			res.end("SUCC");
		});
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
			'X-API-KEY': '35f5c306f9954850a9cc2435c85a8d09',
		},
		url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromCode/',
		body: JSON.stringify(codeObject)
	}, function(error, response, httpBody){
		
		var json = JSON.parse(httpBody);
		var accessToken = String(json.Response.accessToken.value);
		console.log(accessToken);
		var refreshToken = String(json.Response.refreshToken.value);
		
		//now we need to grab the membershipId associated with the accessToken so we can update the links.json file:
		request({
			headers: {
				'X-API-KEY': '35f5c306f9954850a9cc2435c85a8d09',
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
				
				var destiny = Destiny("35f5c306f9954850a9cc2435c85a8d09");
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
										linker.refreshToken = refreshToken;
										linked_users[i] = linker;
									}
								}
								console.log('Updating links JSON');
								try{
									console.log("3")
									var jsonString = JSON.stringify(linked_users);
									fs.writeFile("home/links.json", jsonString);
									console.log("Done!");
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


app.get('/groups/', function(req, res){
	fs.exists(__dirname + "/home/events.json", function(exists){
		if(exists){
			fs.readFile(__dirname + "/home/events.json", (err, data) => {
				try{
					console.log(data);
					var jObject = JSON.parse(data); 
					var events = jObject;
					return res.send(JSON.stringify(events));
				}
				catch(err){
					console.log(err)
				}
				
			});
			
		}
		else{
			console.log("Event file does not exist.");
		}
		
	});
});
/*
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

module.exports.Server = Server;
