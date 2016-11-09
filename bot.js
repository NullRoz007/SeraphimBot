const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const Events = require('./events/event');

client.on('ready', () => {
	console.log('Client Connected!');	
});


var messages = [];
var events = [];
client.on('message', message => {
    messages.push(message);
    if(message.content === "!ping"){
	message.reply('You called? (This bot was made by Ben (NullRoz007) and Reusableduck, @ one of them if there are any problems.');
    }
    else if(message.content === "!clear"){
		// Still need to find a way to properly check mod perms
		
		if (true){
			
			var msgPromise = message.channel.fetchMessages(); 
			
			msgPromise.then(function (pastMsgs) {
				console.log('Stuff worked - 1');
				var promiseArray = pastMsgs.deleteAll();
			
				console.log(promiseArray.length);
			
				for (var i = 0; i < promiseArray.length; i++){
					promiseArray[i].then(function (test){
							console.log('Stuff worked');
						});
					promiseArray[i].catch(function (err){
							console.log('WE GOT ERR', err);
						});
				}
			});
			
			msgPromise.catch(function (err){
							console.log('WE GOT ERR - 1', err);
						});			
		}
    }
    else if(message.content === "!log"){
	var output = "";
	for(index = 0; index < messages.length; ++index){
	    console.log(messages[index].author+":"+messages[index].content);	
	    output += messages[index].author+":"+messages[index].content+"\n";	

	}
	fs.writeFile("log-"+client.uptime+".log", output, function(err){
		if(err){
			return console.log(err);
		}
		console.log("Wrote log.");
	});
    }
    else if(message.content === "!help"){
    }
    else if(message.content.split(' ').length >= 1){
		var splitMessage = message.content.split(' ');
		//syntax: !event new 'Event name' time (00:00) timezone (CST, CET, CEST etc)
		if(splitMessage[0] === "!post")
		{
			
			console.log("Creating new event...");
			
			try
			{
				var name = "";
				var n = 0;
				//var starttime = "";
				//var timezone = "";
				console.log(message.content.indexOf('"'));
				if(String(message.content).indexOf('"') > -1){
					console.log('!');
					var split = message.content.split('"');
					if(split.length == 3){
						name = split[1];
						n = name.split(' ').length - 1;
						console.log(n);
					}
					else{
						message.reply("Invalid Syntax");
					}
				}
					
				else{
					name = splitMessage[1];
					var diff = "";
					var fullName = "";
					if(name.indexOf('-') > -1){
						//contains a dash, ie wotm-h
						
						diff = name.split('-')[1];
						if(String(diff) == "h"){
							diff = "HM";
						}
						else if(String(diff) == "n"){
							diff = "NM"
						}
						else {
							diff = "";
						}
							
					}
					if(name == "wotm")
					{
						fullName = "Wrath of The Machine "+diff;
					}
					else if(name == "kf")
					{
						fullName = "King's Fall "+diff;
					}
					else if(name == "ce")
					{
						fullName = "Crota's End"+diff;
					}
					else if(name == "vog"){
						fullName = "Vault of Glass "+diff;
					}
					else{
						fullName = name;
					}
				}
					
				var event = new Events.Event(events.length+1, fullName, splitMessage[3 + n], splitMessage[4 + n]); 
				console.log(event);
				message.reply("Creating your event: ID="+event.id+", Name="+event.name+", Start time="+event.startTime+"-"+event.timeZone);
				events.push(event);
			}	
			catch(err)
			{
				console.log(err.message);
			}
		}
	}
    }
    else if(message.content == "!clearlog"){
	//WIP
    }
});

client.on("guildMemberAdd", (member) => {
	console.log("New Member Joined!");
	console.log(member.user);
	for(i = 0; i < client.channels.array().length; ++i){
		if(client.channels.array()[i].name == "general")
		{
			client.channels.array()[i].sendMessage("Welcome to Seraphim Elite "+member.user+", make sure you read the rules in # welcome-read-me, and feel free to introduce yourself to the rest of the clan! If you haven't already, you can set Seraphim Elite as your active clan at: https://www.bungie.net/en/Clan/Forum/1669611");
		}
	}
});


//client.login('MjQ0NjEzOTYyOTE2NjkxOTY4.CwFLlA.-JAnNUCZg1DdQwbtlIrW1r51xg4'); //BenBot
client.login('MjQxODI2MjM3OTk0MTA2ODgw.Cv2KwA.LSE2UW3q0TY_xlpifGhSr3EijSY'); //DuckBot

 /**function hasModPerms(input) {
	 
	var userRoles = input.server.rolesOfUser(input.author);
	var check = false;
	var modRoles = [ "Admin", "Moderator" ];
	
	for (var i = 0; i < userRoles.length; i++){
		for (var j = 0; j < modRoles.length; j++){
			if (modRoles[j] == userRoles[i].name){
				check = true;
			}
		}
	}
	return check;
} */
