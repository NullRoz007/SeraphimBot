const Discord = require('discord.js');
const music = require('./music.js');
const fs = require('fs');
const client = new Discord.Client();

const Events = require('./events/event');
var colors = require('colors');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var path = require('path');
var Jimp = require('jimp');
var Destiny = require('./destiny-client');
var guardianApi = require('./guardiangg/guardian')
var querystring = require('querystring');
var sha1 = require('sha1');
var util = require('util');
var plotly = require('plotly')("NullRoz007", "2yYBQDRLXf5OyHfHUHuA");
var striptags = require('striptags');
var messages = [];
var events = [];
var event_offset = 0;
var linked_users = [];
var user_modes = [];
var loadouts = [];
var recirds = [];
var APIKEY = null;
var destiny = null;
var request = require('request');
var config = null;
var sys = require('sys')
var exec = require('child_process').exec;
var last_manifest_version = null;

var stat_hashes = {
	"Light": "3897883278",

	"144602215": "Intellect", 
	"1735777505": "Discipline",
	"4244567218": "Strength"
}

class_hashes = {
	671679327 : "hunter", 
	2271682572 : "trash",
	3655393761 : "titan"
};

var record_book_hashes = [
	{name: 'Age of Triumph', recordBookHash: '840570351', itemHash: '1469071803'}
]

var raid_map = [
	{color: 0x239B56, name: "CrotaHeroic", c_modes: [], icon: 'https://www.bungie.net/common/destiny_content/icons/e619a50b6db5110403b9978d98383016.png'},
	{color: 0x0000FF, name: "VaultOfGlassHeroic", c_modes: [], icon: 'https://www.bungie.net/common/destiny_content/icons/b20cd4ced07bfaa541cb1f54816aec95.png'},
	{color: 0x239B56, name: "KingsFallHeroic", c_modes: [], icon: 'https://www.bungie.net/common/destiny_content/icons/b20cd4ced07bfaa541cb1f54816aec95.png'},
	{color: 0x239B56, name: "WrathOfTheMachineHeroic", c_modes: [], icon: 'https:/www.bungie.net/common/destiny_content/icons/b20cd4ced07bfaa541cb1f54816aec95.png'}
	
	//Add the others here, once we know their recruitmentIds
]

//game modes for guardian.gg
var gg_modes = {
	"skirmish": "9", 
	"control": "10", 
	"clash": "12", 
	"rumble": "13", 
	"trials": "14",
	"ironbanner": "19",
	"elimination": "23",
	"rift": "24",
	"zonecontrol": "28", 
	"supremacy": "31", 
	"all": "34",
	"rumblesupremacy": "531"
}

var months = {
	"1": "Jan",
	"2": "Feb",
	"3": "Mar",
	"4": "Apr",
	"5": "May",
	"6": "Jun",
	"7": "Jul",
	"8": "Aug",
	"9": "Sep",
	"10": "Oct",
	"11": "Nov",
	"12": "Dec"
}

var VERSION = "1.3.2";
var changelog = VERSION+": \n" +
				"	 1) Added !destiny recordbook list and !destiny recordbook <pagenumber>\n" +
				"    2) Added music commands"


			
client.on('ready', () => {
	console.log('Client Connected!');	
	updateGroupsList();
	updateLinksList();
	updateLoadoutsList();
	updateUserModesList();
	
	var logging_channel = getChannel("bot-output");
	
	
	/*console.log = function(message){
		logging_channel.sendMessage("**File**: "+String(path.basename(_getCallerFile()))+"Time: "+String(Date.now())+": ```"+message+"```");
	};*/
	
	client.user.setGame("Ver: " + VERSION)
		.then(console.log("Set the game status"))
		.catch(err => console.log(err));
	music(client, "Music", {channel: 'bot-commands'});
		
});

client.on('message', message => {
	
	if(message.channel.type != "text"){
		return;
	}
	//commands that run in all channels:
	
	if(message.channel.name != "announcements"){
		
		if(message.content === "!ping"){
			message.reply('You called? (This bot was made by Ben (NullRoz007) and Reusableduckk, @ one of them if there are any problems.\nCurrent Version: '+VERSION);
		}
		else if(message.content ==="!changelog"){
			message.channel.sendMessage("Current Version: "+VERSION+"\n"+"Change Log: \n"+changelog);
		}
		//clear messages from channel
		else if(message.content === "!clear"){	
			if (hasModPerms(message)){
			
				//fetch our messages from the channel
				var msgPromise = message.channel.fetchMessages(); 
			
				msgPromise.then(function (pastMsgs) {
					console.log('Finished fetching messages...');
					var promiseArray = pastMsgs.deleteAll();
			
					console.log(promiseArray.length);
			
					for (var i = 0; i < promiseArray.length; i++){
						promiseArray[i].then(function (test){
							console.log('Message deleted');
						});
						promiseArray[i].catch(function (err){
							console.log('FAILURE DELETING MESSAGE', err);
						});
					}
				});
			
				msgPromise.catch(function (err){
					console.log('WE GOT ERR - 1', err);
				});		
						
			} else {
				message.reply('You are not a moderator');
			}	
		}
		else if (message.content === "!phrasing"){
			message.channel.sendMessage("https://cdn.discordapp.com/attachments/287330746681524234/287332316500459520/f12d01f97d13207582d6962651aee4e5.png");
		}
		else if (message.content === "!ants"){
			message.channel.sendMessage("https://images.discordapp.net/.eJwNyEsOhSAMAMC7cACKVX7ehoekmogQWlfm3V2TWc2j7nGqVe0inVeA7eDcxqZZ2khUNLVGZ0n9YJ1bhSSS8l7LJQwYbHTR-7g4E4yxiF_5eXYTYnDW4GcBun--6n6R-r_AUSGx.VXTb5E1cq6s1mZ92JfmTFoY47Tg");
		}
		else if (message.content === "!opinion"){
			message.channel.sendMessage("https://images.discordapp.net/.eJwNyG0KwyAMANC7eADjrF_pbUTFFmwjJmOwsbtv7-f7qOcaaleHyOQdoJ5caFXNQiv3pjtRHy3Pk3WhC7JILsfVbmGwyWPAGNEFk4zx1v4rblsw3mH0KaF7ILwrjpeed1ffH8McIek.V-qBI3wev4U7dbmXtndJro2ugP8");
		}
		else if (message.content === "!stress"){
			message.channel.sendMessage("https://images.discordapp.net/.eJwNyEEOhCAMAMC_8ACKQIX6mwYJmqgQWk-b_fvuHOdj3nmZzRyqQzaA_ZTS525F--RWbeu9XZXHKbb0G1iVy3HXRwV8RlopJYqry86h9_9KISARhogpLJgjvLzMasfTzPcHwfEhxg._jLLjTv7cjzfCxDhFdzJnJe-De4");
		}
		else if (message.content === "!allstar"){
			message.channel.sendMessage("https://www.youtube.com/watch?v=L_jWHffIx5E");
			message.channel.sendMessage("Somebody once told me.....");
		}
		else if (message.content === "!benson"){
			message.channel.sendMessage("https://www.youtube.com/watch?v=bPFS1iZvlds");
		}
		else if (message.content === "!friday"){
		
			var today = new Date();
		
			if (today.getDay() == 5){
				message.channel.sendMessage("https://www.youtube.com/watch?v=kfVsfOSbJY0");
			} else {
				message.channel.sendMessage("Today is not Friday");
			}	
		}
		else if (message.content === "!hepballs"){
		
			message.channel.sendMessage("https://youtu.be/Tctfq4tplQ4?t=22s");	
		}

	
		else if (message.content === "!twitch") {
			getTwitch(message, "seraphimelite1");
		}

		
		else if(message.content === "!mygroups"){
			var username = message.member.user.username;
			var user_events = getGroups(username);
			var output = "";
				for(i = 0; i < user_events.length; i++){
					try{			
						output += Events.out(user_events[i]);					
					} catch(err){
						message.channel.sendMessage(err);
					}
					
				}
				message.channel.sendMessage(output);
		}

		else if(message.content.split(' ').length >= 1){
			var splitMessage = message.content.split(' ');	
			if(splitMessage[0] === "!clear"){
				var amount = splitMessage[1];
				if (hasModPerms(message)){
				
					var msgPromise = message.channel.fetchMessages({limit: amount}); 
				
					msgPromise.then(function (pastMsgs) {
						console.log('Finished fetching messages...');
						var promiseArray = pastMsgs.deleteAll();
				
						console.log(promiseArray.length);
				
						for (var i = 0; i < promiseArray.length; i++){
							promiseArray[i].then(function (test){
								console.log('Message deleted '+i+'/'+amount);
							});
							promiseArray[i].catch(function (err){
								console.log('FAILURE DELETING MESSAGE', err);
							});
						}
					});
				
					msgPromise.catch(function (err){
						console.log('WE GOT ERR - 1', err);
					});		
							
				} 
				else {
					message.reply('You are not a moderator');
				}
			}
			else if(splitMessage[0] === "!post")
			{	
				if(!hasModPerms(message) && !hasRole(message, "Seraph")){
					message.reply("You need to get a clan tag before you can post your own groups, feel free to ask a mod or join someone else's group.")
					return;
				}
				
				console.log("Creating new event...");	
				try
				{
					var name = "";
					var n = 0;
					var fullName = "";
					//var starttime = "";
					//var timezone = "";
					console.log(message.content.indexOf('"'));
					if(String(message.content).indexOf('"') > -1){
						console.log('!');
						var split = message.content.split('"');
						if(split.length == 3){
							fullName = split[1];
							n = fullName.split(' ').length - 1;
							console.log(n);
						}
						else{
							message.reply("Invalid Syntax");
						}
					}
						
					else{
						name = splitMessage[1];
						var diff = "";
						
						if(name.indexOf('-') > -1){
							//contains a dash, ie wotm-h
							console.log("!");
							diff = name.split('-')[1];
							console.log(diff);
							if(String(diff) == "h"){
								diff = "Hard Mode";
							}
							else if(String(diff) == "n"){
								diff = "Normal Mode"
							}
							else {
								diff = "";
							}
								
						}
						
						
						
						if(name.split('-')[0] == "wotm")
						{
							fullName = "Wrath of The Machine "+diff;
						}
						else if(name.split('-')[0] == "kf")
						{
							fullName = "King's Fall "+diff;
						}
						else if(name.split('-')[0] == "ce")
						{
							fullName = "Crota's End "+diff;
						}
						else if(name.split('-')[0] == "vog"){
							fullName = "Vault of Glass "+diff;
						}
						else if(name.split('-')[0] == "coe"){
							fullName = "Challenge of Elders";
						}
						else{
							fullName = name;
						}
					}
						
					var newEvent = new Events.Event(events.length + 1, fullName, splitMessage[2 + n], splitMessage[3 + n], splitMessage[4 + n], message.member.user.username);
					
					message.channel.sendMessage(
						"```\n================================\n"+fullName+
						"\n================================\nDate: "+newEvent.date+
						"\nStart Time: "+newEvent.startTime + "-"+newEvent.timeZone+
						"\n================================\nGroup ID: "+newEvent.id+
						"\n================================```");
					Events.addPlayer(newEvent, message.member.user.username);
					//message.reply("Creating your event: ID="+event.id+", Name="+event.name+", Start time="+event.startTime+"-"+event.timeZone);
					console.log(newEvent);
					events.push(newEvent);
				}	
				catch(err)
				{
					console.log(err.message);
				}
				updateGroupsJSON();
				
			}
			else if(splitMessage[0] == "!groups"){
				
				if(splitMessage.length == 1){
					
					message.reply("I am sending you a DM now...");
					var dmSize = 10;
					var numberOfDMs = Math.ceil(events.length/dmSize);
					
					for(i = 0; i < numberOfDMs; i++){
						
						var output = "";
						
						for(j = 0; j < dmSize; j++){
							var index = (i*dmSize)-1 + j;
							if(index >= events.length){
								break;
							}
							try{
								output += Events.out(events[index]);
							}
							catch(err){
								message.channel.sendMessage(err);
							}	
						}	
						message.author.sendMessage(output)
							.then(res => {
								console.log((i+1)+" sent successfully");
							}).catch(err => {
								console.log("Error sending " + (i+1));
								//console.log(err);
							});	
					}
						
						
						
				} else if(splitMessage.length == 2){
					var id = splitMessage[1];
					
					// We don't really need the 'all' argument, leaving it just in case some people are used to it
					if(id == "all"){
						
						message.reply("I am sending you a DM now...");
						var dmSize = 10;
						var numberOfDMs = Math.ceil(events.length/dmSize);
						
						for(i = 0; i < numberOfDMs; i++){
							
							var output = "";
							
							for(j = 0; j < dmSize; j++){
								var index = (i*dmSize)-1 + j;
								if(index >= events.length){
									break;
								}
								try{
									output += Events.out(events[index]);
								}
								catch(err){
									message.channel.sendMessage(err);
								}	
							}	
							message.author.sendMessage(output)
								.then(res => {
									console.log((i+1)+" sent successfully");
								}).catch(err => {
									console.log("Error sending " + (i+1));
									//console.log(err);
								});	
						}
					} else {
						
						intId = parseInt(id);
						var pagesize = 6;
						offset = (intId - 1)*pagesize;
						
						output = "Now viewing page " + id + " of " + Math.ceil(events.length/pagesize) + "\n\n";
						
						for(i = 0; i < pagesize ; i++){
							var temp = events.length - 1 - i - offset;
							if(temp  < 0) { break;}
							try{
								output += Events.out(events[temp]);
							}
							catch(err){
								message.channel.sendMessage(err);
							}	
						}
						message.channel.sendMessage(output);
					}
				}
				else{
					sendCommandError(message, " it's missing/too many arguments", "!groups 1 or !groups all");
				}
			}
			else if(splitMessage[0] == "!group"){
				if(splitMessage.length == 2 || splitMessage.length == 3){
					var id = splitMessage[1];
					if(id - 1 < events.length && id > 0){
						var event = events[parseInt(id) - 1];
						
						const embed = new Discord.RichEmbed()
							.setTitle(event.name)
							.setColor(0x00AE86)
							.addField("Date", event.date)
							.addField("Start Time", event.startTime + "-" + event.timeZone)
								
							
								 
						output = "```\n================================\n"+event.name+"\n================================\nDate: "+event.date+"\nStart Time: "+event.startTime + "-"+event.timeZone+"\n================================\nGroup ID: "+event.id+"\n================================"+"\nRoster:\n";
						var playerIndex = 1;
						var players = "";
						for(i = 0; i < event.players.length; i++){
							if(playerIndex==7)
							{
								players+= "Substitutes:\n";
								output += "Substitutes:\n";
							}
							players += playerIndex+". "+event.players[i]+"\n";
							output += playerIndex+". "+event.players[i]+"\n";
							++playerIndex;
						}
							
						if(players == ""){
							console.log("players is empty!")
							embed.addField("This group is empty.", "use !joingroup "+id+" to join it, or if you are the groups creator you can use !removegroup "+id+" to delete it.");
						}
						else{
							embed.addField("Players", players);
						}
						console.log(splitMessage[2]);

							
						if(splitMessage[2] === "legacy" || getUserMode(message) == "legacy"){
							message.channel.sendMessage(output+"```");
						}
						else if(getUserMode(message) == "desktop"){
							message.channel.sendEmbed(embed);
						}
						else{
							message.channel.sendEmbed(embed);
						}
					}
					
				}
				else{
					sendCommandError(message, "  it's missing/too many arguments", "!group 1");
				}
			}
			else if(splitMessage[0] == "!changetime"){
				if(splitMessage.length == 5){
					var id = splitMessage[1];
					if(id - 1 < events.length && id > 0){
						var event = events.find(x => x.id == id);
						
						if((event.creator == message.member.user.username) || hasModPerms(message)){
							Events.editTime(event, splitMessage[2], splitMessage[3], splitMessage[4]);
							message.channel.sendMessage(
								"```\n================================\n"+event.name+
								"\n================================\nDate: "+event.date+
								"\nStart Time: "+event.startTime + "-"+event.timeZone+
								"\n================================\nGroup ID: "+event.id+
								"\n================================```");
								
							updateGroupsJSON();
						} else {
							// mod perms
							message.channel.sendMessage("Only the group creator or a Moderator can do that.")
						}
					} else {
						// group not found
						message.channel.sendMessage("Group not found.")
					}
				} else {
					// Invalid sytax
					sendCommandError(message, " it's missing/too many arguments", "!changetime 2 3/17 8pm EST");
					//message.channel.sendMessage("Missing/too many arguments. Here is an example:\n```\n!changetime 2 3/17 8pm EST\n```");
				}
			}
			else if(splitMessage[0] == "!joingroup"){
				if(splitMessage.length == 2){
					var id = splitMessage[1];
					if(id - 1 < events.length && id > 0){
						var event = events.find(x => x.id == id);
						Events.addPlayer(event, message.member.user.username);
						message.reply("added you to "+event.name);
						updateGroupsJSON();
					}
					
				}
			}
			else if(splitMessage[0] == "!leavegroup"){
				if(splitMessage.length == 2){
					var id = splitMessage[1];
					if(id - 1 < events.length && id > 0){
						
						var event = events.find(x => x.id == id);
						Events.removePlayer(event, message.member.user.username);
						message.reply("removed you from "+event.name);
						updateGroupsJSON();
					}
				}
			}
			else if(splitMessage[0] === "!removegroup"){
				if(splitMessage.length == 2){
					var id = splitMessage[1];
					
					if(id - 1 < events.length && id >= 0){
						try{
							var event = events.find(x => x.id == id);
							var eventC = String(event.creator);
							var messageC = String(message.member.user.username);
							
							if(hasModPerms(message)){
								index = events.findIndex(x => x.id==id);
								events.splice(index, 1);
								for(i = 0; i < events.length; i++){
									events[i].id = i + 1;
								}
							}
							
							else if(eventC === messageC){
								var index = events.findIndex(x => x.id==id);
								events.splice(index, 1);
								for(i = 0; i < events.length; i++){
									events[i].id = i + 1;
								}
							}
							else{
								console.log(message.member.user.username + ", "+event.creator);
								message.channel.sendMessage("You can't delete that group because you are not the creator!");
							}
							message.channel.sendMessage("Removed group: "+event.name);
							updateGroupsJSON();
						}
						catch(err){
							console.log(err);
						}
						
					}
				}
				
			}
			
			else if(splitMessage[0] === "!rolecall"){
				if(splitMessage.length == 2){
					var id = splitMessage[1];
					if(id - 1 < events.length && id > 0){
						var event = events.find(x => x.id == id);
						var output = "Rolecall for "+event.name+" at "+event.startTime+" "+event.timeZone+"\n";
						for(i = 0; i < event.players.length; i++){
							var userToPing = findUserNoMsg(event.players[i]);
							output += userToPing;
						}
						message.channel.sendMessage(output);
					}
				}
			}
			
			else if (splitMessage[0] === "!addtogroup"){
				if(!hasModPerms(message)){
					return;
				}
				
				if (splitMessage.length == 3){
					
					var id = splitMessage[1];
					var userID = message.mentions.users.array()[0];
					
					console.log(userID.username);
					
					if (id - 1 < events.length && id > 0){
						
						var event = events.find(x => x.id == id);

						Events.addPlayer(event, userID.username);
						message.channel.sendMessage("Added " + userID.username + " to group " + id);
						updateGroupsJSON();
					
					
					} else {
						// Could not find event
						message.channel.sendMessage("I could not find that event");
					}
				} else {
					//Missing parameters
					message.channel.sendMessage("There are missing parameters. Here is a usage example: \n```!addtogroup 1 Reusableduckk```");
				}
			}
			
			else if (splitMessage[0] === "!removefromgroup"){
				if(!hasModPerms(message)){
					return;
				}
				
				if (splitMessage.length == 3){
					
					var id = splitMessage[1];
					var userID = message.mentions.users.array()[0];
					
					console.log(userID.username);
					
					if (id - 1 < events.length && id > 0){
						
						var event = events.find(x => x.id == id);
		
						Events.removePlayer(event, userID.username);	
						message.channel.sendMessage("Removed " + userID.username + " from group " + id);
						updateGroupsJSON();
						
						 
					} else {
						// Could not find event
						message.channel.sendMessage("I could not find that group");
					}
				} else {
					//Missing parameters
					message.channel.sendMessage("There are missing parameters. Here is a usage example: \n```!removefromgroup 1 Reusableduckk```");
				}
			}
		}
	}
	
	if(message.channel.name == "announcements" || message.channel.name == "bot-commands"){
		messages.push(message);
		//COMMANDS THAT ONLY WORK IN THE ANNOUNCEMENTS CHANNEL:
		
		//rebuild the groups and links
		if(message.content === "!rebuild"){
			if(isBotCommander(message)){
				try{
					console.log("Rebuilding groups...");
					message.channel.sendMessage("Rebuilding groups...");
					updateGroupsJSON();
					updateGroupsList();
					message.channel.sendMessage("Rebuilding destiny<->discord links...");
					updateLinksJSON();
					updateLinksList();
				}
				catch(err){
					console.log(err);
				}
			}
			else{
				message.channel.sendMessage("You are not a Bot Commander, using this command could have unintended consequences ");
			}
		}
		else if(message.content === "!setgame"){
			if(isBotCommander(message)){
				client.user.setGame("Ver: " + VERSION)
				.then(console.log("Set the game status"))
				.catch(err => console.log(err));
			}
			else{
				message.channel.sendMessage("You are not a Bot Commander, using this command could have unintended consequences ");
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
			
			var h_mod = "**Mod Commands**\n" +
						 "!clear  :  Clears recent messages in the channel\n" +
						 "!clearuser <amount> <username>  :  searches through <amount> message and deletes any authored by <username>\n" +
						 "!addrole <role> <username>  : adds the role to user, if both exist\n" +
						 "!removerole <role> <username>  : removes the role from the user, if both exist\n" +
						 "!addtogroup <groupID> <User mention>  :  You need use the @user mention for this\n" + 
						 "removefromgroup <groupID> <User mention>  :  You need use the @user mention for this\n\n";

			var h_gen = "**General Commands**\n" +
						"!ping  :  A tiny bit about the bot\n" +
						"!changelog : Display the Changelog\n" +
						"!help : Display this message\n\n"+
						"!twitch : Display what is currently streaming on the Twitch Account";
				
			
			var h_lfg = "**LFG Commands**\n" +
						"!post <activity> <date> <time> <timezone>  :  Creates a new group. <activity> can be an abbreviation like wotm or vog. If you do not enter a recognized abbreviation, it will take whatever you entered. You can also add -n or -h to the activity to show normal or hard mode. To use a name with spaces in it put \" around it. \n" +
						"!groups  :  Displays all active groups\n" +
						"!mygroups : Display all active groups that you are a member of\n"+
						"!group <ID> <option> :  Displays a specific group with the given ID\n" +
						"!joingroup <ID>  :  Join the group with the given ID\n" +
						"!leavegroup <ID>  :  Leave the group with the given ID\n" +
						"!removegroup <ID>  :  Removes the group with the given ID. Removed groups erased and can no longer be joined. Only the creator can use this\n" +
						"!rolecall <ID>  :  @ mentions everyone in the given group. Please do not abuse this.\n\n"; +
						"!changetime <ID> <Date> <Time> <Timezone>  :  Changes the date and time for that group. Must be the group creator or a moderator to use this."
			
			var h_des = "**Destiny Commands**\n"+
						"!destiny link <psn_name> : Link your Discord account to your Destiny account (REQUIRED)\n" +
						"!destiny unlink : Unlink your Discord and Destiny accounts\n"+
						"!destiny gr : Get your current grimoire score \n"+
						"!destiny elo : Get your current highest Elo from guardian.gg\n" +
						"!destiny kd <games> <characterindex 0-2>: Get your kd ratio over a number of games, including your average kd ratio over these games.\n" +
						"!destiny raids <optionalstat> : Get your raid clears on all characters, + an option stat\n"+
						"!destiny elograph <gamemode> <graphtype> <specialoption> : graphtype can be anything found at the bottom of this webpage: https://plot.ly/javascript, however scatter works best. specialoptions can only be -f, for fill.\n" + 
						"!destiny current : Displays the current activity you are in.\n" + 
						"!destiny event list : list avaliable events.\n"+
						"!destiny event <eventname> : Get an event, (not working for some events)\n"+
						"!destiny weeklysummary  :  can only be called from announcements.\n"+
						"!destiny xur : can only be called from announcements.\n"+
						"!destiny recordbook : view the Age of Triumph record book.\n"+
						"!destiny recordbook list : view avaliable pages in the Age of Triumph record book.\n"+
						"!destiny recordbook <page_number> : view a specific page from the Age of Triumph record book."						
			
			var m_des = "**Music Commands**\n"+
						"!play <name> : Queue up a song from youtube, (this will get the top video in the list of results).\n"+
						"!pause : pause the currently playing song.\n"+
						"!resume : resume the currently playing song.\n"+
						"!"
			message.reply("I'm sending you a DM now...");
			
			
			if (hasModPerms(message)){
				message.author.sendMessage(h_mod)
					.then(console.log("Sucess"))
					.catch(err => console.log(err));
			}
					
			message.author.sendMessage(h_gen)
					.then(console.log("Sucess"))
					.catch(err => console.log(err));
					
			message.author.sendMessage(h_lfg)
					.then(console.log("Sucess"))
					.catch(err => console.log(err));
					
			message.author.sendMessage(h_des)
					.then(console.log("Sucess"))
					.catch(err => console.log(err));
			
		}
		
		else if(message.content.split(' ').length >= 1){
			var splitMessage = message.content.split(' ');
				
				if(splitMessage[0] === "!createRole"){
					if(hasModPerms(message))
					{
						var rolename = splitMessage[1];
						if(rolename[0] == '"'){
							var string_split = message.content.split('"')[1];
							rolename = string_split;
						}
						var guild = message.guild;
						guild.createRole({
							name: rolename,
						})
						.then(role => message.channel.sendMessage("Created role: "+rolename))
						.catch(console.error);
					}
					
				}
				else if(splitMessage[0] === "!deleteRole"){
					if(hasModPerms(message)){
						var rolename = splitMessage[1];
						if(rolename[0] == '"'){
							var string_split = message.content.split('"')[1];
							rolename = string_split;
						}
						var role = message.guild.roles.find('name', rolename);
						role.delete()
							.then(message.channel.sendMessage("Deleted role: "+rolename))
							.catch(console.error);
					}
					
				}
				else if(splitMessage[0] === "!loadout"){
					if(!isBotCommander(message)){
						message.channel.sendMessage("This command is currently restricted to Bot Commanders only!");
						return;
					}
					if(splitMessage[1] === "list"){
						for(x = 0; x < linked_users.length; x++){
							var check = linked_users[x].discordName;
							
							if(message.member.user.username == check){
								
								var output = "Loadouts: \n```";
								for(i = 0; i < loadouts.length; i++){
									var owner = loadouts[i].owner;
									console.log(loadouts[i]);
									if(owner == linked_users[x].destinyId){
										
										output += "ID: "+i+", Name: "+loadouts[i].name+"\n";
									}
								}
								output += "```";
								message.channel.sendMessage(output);
							}
						}
					}
					else if(splitMessage[1] === "detail"){
						for(x = 0; x < linked_users.length; x++){
							var check = linked_users[x].discordName;
							
							if(message.member.user.username == check){
								var index = Number(splitMessage[2]);
								var loadout = loadouts[index];
								
								console.log("ID: "+linked_users[x].destinyId+"\nCHAR_ID: "+loadout.characterId+"\nITEM: "+loadout.items[0].prim_insId);
								var options = {
									headers: {
										"X-API-Key": APIKEY
									},
									url: "http://www.bungie.net/Platform/Destiny/2/Account/"+linked_users[x].destinyId+"/Character/"+loadout.characterId+"/Inventory/"+loadout.items[0].itemId+"/"
								};
								var options_prim = {
									headers: {
										"X-API-Key": APIKEY
									},
									url: "http://www.bungie.net/Platform/Destiny/2/Account/"+linked_users[x].destinyId+"/Character/"+loadout.characterId+"/Inventory/"+loadout.items[1].itemId+"/"

								};
								var options_sec = {
									headers: {
										"X-API-Key": APIKEY
									},
									url: "http://www.bungie.net/Platform/Destiny/2/Account/"+linked_users[x].destinyId+"/Character/"+loadout.characterId+"/Inventory/"+loadout.items[2].itemId+"/"
								}	
								var options_heavy = {
									headers: {
										"X-API-Key": APIKEY
									},
									url: "http://www.bungie.net/Platform/Destiny/2/Account/"+linked_users[x].destinyId+"/Character/"+loadout.characterId+"/Inventory/"+loadout.items[3].itemId+"/"
								}
								var items_string = "";
								var icons = [];
								var embed = new Discord.RichEmbed();
								
								request(options, function(error, response, body){
									var response = JSON.parse(body);
									var item_hash = response.Response.data.item.itemHash;
									console.log(item_hash);
									
									request(options_prim, function(error, response, body){
										var prim_hash = JSON.parse(body).Response.data.item.itemHash;
										var manifest_options = {
											headers: {
												"X-API-Key": APIKEY
											},
											url: "http://www.bungie.net/Platform/Destiny/Manifest/InventoryItem/"+prim_hash+"/"
										};
										message.channel.sendMessage("Working...");
										request(manifest_options, function(error, response, body){
											var prim = JSON.parse(body);
											
											var name = prim.Response.data.inventoryItem.itemName;
											embed.addField(name, prim.Response.data.inventoryItem.itemDescription);
											var icon = prim.Response.data.inventoryItem.icon;
											icons.push(icon);
											
											request(options_sec, function(error, response, body){
												var sec_hash = JSON.parse(body).Response.data.item.itemHash;
												manifest_options.url = "http://www.bungie.net/Platform/Destiny/Manifest/InventoryItem/"+sec_hash+"/";
												
												request(manifest_options, function(error, response, body){
													var sec = JSON.parse(body);
													var name = sec.Response.data.inventoryItem.itemName;
													var icon = sec.Response.data.inventoryItem.icon;
													embed.addField(name, sec.Response.data.inventoryItem.itemDescription);
													icons.push(icon);
													
													request(options_heavy, function(error, response, body){
														var heavy_hash = JSON.parse(body).Response.data.item.itemHash;
														manifest_options.url = "http://www.bungie.net/Platform/Destiny/Manifest/InventoryItem/"+heavy_hash+"/";
														
														request(manifest_options, function(error, response, body){
															var heavy = JSON.parse(body);
															var name = heavy.Response.data.inventoryItem.itemName;
															var icon = heavy.Response.data.inventoryItem.icon;
															embed.addField(name, heavy.Response.data.inventoryItem.itemDescription);
															icons.push(icon);
															
															request(options, function(error, response, body){
																var sub_hash = JSON.parse(body).Response.data.item.itemHash;
																manifest_options.url = "http://www.bungie.net/Platform/Destiny/Manifest/InventoryItem/"+sub_hash+"/";
																
																request(manifest_options, function(error, response, body){
																	var sub = JSON.parse(body);
																	var name = sub.Response.data.inventoryItem.itemName;
																	var icon = sub.Response.data.inventoryItem.icon;
																	console.log(icons);
																	embed.setTitle(loadout.name + " - "+name);
																	embed.setDescription(items_string);
																	embed.setThumbnail("http://www.bungie.net/"+icon);
																	message.channel.sendEmbed(embed);
																
																});
															});
														});
													});
													
													console.log(items_string);
													console.log(icons);
												});
											});
											
										});
									});
								});
							}
						}
					}
					else if(splitMessage[1] === "equip"){
						for(x = 0; x < linked_users.length; x++){
							if(linked_users[x].discordName == message.member.user.username){
								//var token = linked_users[x].token;
								var linker = linked_users[x];

								var refreshToken = linked_users[x].refreshToken;
								var membershipId = linked_users[x].destinyId;
								var index = Number(splitMessage[2]);
								var loadout = loadouts[index];
								
								if(loadout.owner != linked_users[x].destinyId){
									console.log("user does not own loadout: "+loadout);
									return;
								}

								updateLinksList();
								refreshAccessToken(membershipId, refreshToken);
								var token = linked_users[x].token;

								console.log(loadout);
								destiny.Account({
									membershipType: 2,
									membershipId: membershipId
								}).then(acc => {
									//console.log(acc);
								
									setupLoadout(loadout, acc.characters[0].characterBase.characterId, linker);
									var statuses = [];
									var sub_options = {
										headers: {
											'X-API-KEY': APIKEY,
											'Authorization': 'Bearer '+token
										},
										url: 'https://www.bungie.net/Platform/Destiny/EquipItem/',
										body: JSON.stringify({characterId: acc.characters[0].characterBase.characterId, itemId: loadout.items[0].itemId, membershipType: 2})
									};
									var statuses = [];

									request.post(sub_options, function(error, response, body){
										var response = JSON.parse(body);
										console.log(response);
										
										
										if(response.ErrorStatus == "AccessTokenHasExpired"){
											//user needs to reauthenticate their access token, this will be done automaticly in the future:
											message.channel.sendMessage("Your access token has expired, to continue using loadouts you need to re-authenticate at: https://www.bungie.net/en/Application/Authorize/11575");
											
											
											return;
										}
												
										statuses.push(response.ErrorStatus);
										if(response.Message != 'Ok'){
													message.channel.sendMessage("Unable to equip item because: "+response.Message);
										}
										var prim_options = {
											headers: {
												'X-API-KEY': APIKEY,
												'Authorization': 'Bearer '+token
											},
											url: 'https://www.bungie.net/Platform/Destiny/EquipItem/',
											body: JSON.stringify({characterId: acc.characters[0].characterBase.characterId, itemId: loadout.items[1].itemId, membershipType: 2})

										};
										setTimeout(function() {
											request.post(prim_options, function(error, response, body){
												var response = JSON.parse(body);
												console.log(response);
												statuses.push(response.ErrorStatus);
												
												if(response.Message != 'Ok'){
													message.channel.sendMessage("Unable to equip item because: "+response.Message);
												}
												var sec_options = {
													headers: {
														'X-API-KEY': APIKEY,
														'Authorization': 'Bearer '+token
													},
													url: 'https://www.bungie.net/Platform/Destiny/EquipItem/',
													body: JSON.stringify({characterId: acc.characters[0].characterBase.characterId, itemId: loadout.items[2].itemId, membershipType: 2})
												};
												setTimeout(function() {
													request.post(sec_options, function(error, response, body){
														var response = JSON.parse(body);
														console.log(response);
														statuses.push(response.ErrorStatus);
														if(response.Message != 'Ok'){
															message.channel.sendMessage("Unable to equip item because: "+response.Message);
														}
														var heavy_options = {
															headers: {
																'X-API-KEY': APIKEY,
																'Authorization': 'Bearer '+token
															},
															url: 'https://www.bungie.net/Platform/Destiny/EquipItem/',
															body: JSON.stringify({characterId: acc.characters[0].characterBase.characterId, itemId: loadout.items[3].itemId, membershipType: 2})
														};
														setTimeout(function() {
															request.post(heavy_options, function(error, response, body){
																var response = JSON.parse(body);
																console.log(response);
																statuses.push(response.ErrorStatus);
																if(response.Message != 'Ok'){
																	message.channel.sendMessage("Unable to equip item because: "+response.Message);
																}
																
																if(allAre("Success", statuses)){
																	message.channel.sendMessage("Equipped all items in "+loadout.name);
																}
																else{
																	message.channel.sendMessage("Failed to equip all items in "+loadout.name);
																}
															});
														}, 2000);
													});
												}, 2000);
											});
										}, 2000);
									});
									
								});
							}
						}
					}
					else if(splitMessage[1] === "create"){
						for(x = 0; x < linked_users.length; x++){
							var check = linked_users[x].discordName;
							
							if(message.member.user.username == check){
								var name = splitMessage[2];
								if(!name){
									return;
								}
								
								var membershipId = linked_users[x].destinyId;
								
								var loadout = {
									owner: membershipId,
									characterId: "",
									name: name, 
									items: []
								}
								console.log("ID: "+membershipId);
								destiny.Account({
									membershipType: 2,
									membershipId: membershipId
								}).then(res => {
									var id = res.characters[0].characterBase.characterId;
									loadout.characterId = id;
									destiny.Inventory({
										membershipType: 2,
										membershipId: membershipId,
										characterId: id
									}).then(inv => {
										var sub_insId;
										var sub_hash;
										var prim_insId;
										var prim_hash;
										var sec_insId;
										var sec_hash;
										var heavy_insId;
										var heavy_hash;
										
										var subclass = inv.buckets.Equippable[0].items;
										sub_insId = subclass[0].itemInstanceId;
										sub_hash = subclass[0].itemHash;
										console.log(subclass[0]);
										var prim = inv.buckets.Equippable[1].items;
										prim_insId = prim[0].itemInstanceId;
										prim_hash = prim[0].itemHash;
										var sec = inv.buckets.Equippable[2].items;
										sec_insId = sec[0].itemInstanceId;
										sec_hash = sec[0].itemHash;
										var heavy = inv.buckets.Equippable[3].items;
										heavy_insId = heavy[0].itemInstanceId;
										heavy_hash = heavy[0].itemHash;

										console.log("SUB: "+sub_insId);
										console.log("PRIM: "+prim_insId);
										console.log("SEC: "+sec_insId);
										console.log("HEAVY: "+heavy_insId);
										loadout.items = [
											{itemHash: String(sub_hash), itemId: sub_insId, characterId: id}, 
											{itemHash: String(prim_hash), itemId: prim_insId , characterId: id}, 
											{itemHash: String(sec_hash), itemId: sec_insId, characterId: id}, 
											{itemHash: String(heavy_hash), itemId: heavy_insId, characterId: id }
										];
										
										console.log(loadout);
										loadouts.push(loadout);
										
										message.channel.sendMessage("Created loadout: "+loadout.name);
										updateLoadoutsJSON();
										
									});
								});
							}
						}
					}
				}
				else if(splitMessage[0] === "!setmode"){
					if(splitMessage[1] != null){
						setUserMode(message, splitMessage[1]);
						updateUserModesJSON();
					}
				}

				else if(splitMessage[0] === "!destiny"){
					if(splitMessage[1] === "twab"){
						if(message.channel.name != "announcements"){
							return;
						}
						sendNews("destiny", "en", message);
					}
					else if(splitMessage[1] === "recordbook"){
						setupManifest(message, (result) => {
							if(result.done){
								if(splitMessage.length == 3){
									if(splitMessage[2] == "list"){
										
										fs.readFile("aot.json", (err, data) => {
											var aot = JSON.parse(data);
											var embed = new Discord.RichEmbed()
												.setTitle("Avaliable Pages");
											var i = 0;
											var desc = "";
											aot.pages.forEach((page) => {
												console.log(page);
												desc += i+") "+page.displayName+"\n";
												i++;
											});
											embed.setDescription(desc);
											embed.setThumbnail("https://www.bungie.net/common/destiny_content/icons/dff552e423015c3c755cd3bf374bf93e.png");
											
											message.channel.sendEmbed(embed);
											
										
										});
										
										var names = "";
										for(i = 0; i < record_book_hashes.length; i++){
											
											var name = record_book_hashes[i].name;
											var hash = record_book_hashes[i].hash;
											names += (i+1)+"): "+name+" - ID: "+i+"\n"
											
										}
										embed.setDescription(names);
										
										message.channel.sendEmbed(embed);
									}
									else if(isNumber(splitMessage[2])){
										fs.readFile("aot.json", (err, data) => {
											var aot = JSON.parse(data);
											var page = aot.pages[Number(splitMessage[2])];
											if(page.displayStyle != 0) {message.channel.sendMessage("I can't display that page because it does not use the correct display style. "); return; }
											//console.log(page);
											
											var bookHash = record_book_hashes[0].recordBookHash;
											var title = page.displayName;
											var description = page.displayDescription;
											var hashes = [];
											
											page.records.forEach((record) => {
												hashes.push(record.recordHash);
											});
											
											var linker = getLinker(message.member.user.username);
											console.log("Using memID: "+linker.destinyId);
											
											var embed = new Discord.RichEmbed()
												.setTitle("Page: *"+title+"*")
												.setDescription("*"+description+"*\n");
												
											destiny.Advisors({
												membershipType: 2,
												membershipId: linker.destinyId
											}).then(res => {
												var cor_records = [];
												for(var prop in res.recordBooks[bookHash].records){
													if(res.recordBooks[bookHash].records.hasOwnProperty(prop)){
														var record = res.recordBooks[bookHash].records[prop];
														if(hashes.contains(record.recordHash)){
															cor_records.push(record);
														}
													}
												}
												var pl_records = [];
												
												cor_records.forEach((record) => {
													records.forEach((rec) => {
														
														var rec_obj = JSON.parse(rec.json);
														if(rec_obj.hash == record.recordHash){
															console.log(rec_obj);
															var completed = record.objectives[0].isComplete ? "Completed" : "Not Completed";
															var obj = {
																obj: rec_obj,
																rec: record,
																comp: completed
															};
															pl_records.push(obj);				
														}
													});	
												});
												
												pl_records.sort(function(a, b){
													return a.obj.index - b.obj.index;
												});
												
												
												var finished_rec = pl_records[pl_records.length - 1];
												console.log(finished_rec);
												var icon = finished_rec.obj.index != 79 ? finished_rec.obj.icon : pl_records[0].obj.icon;
												embed.setThumbnail("http://www.bungie.net/"+icon);
												embed.setImage("https://www.bungie.net/img/theme/destiny/bgs/record_books/bg_age_of_triumph_book.jpg");
												pl_records.forEach((object) => {
													embed.addField(object.obj.displayName,"*"+object.rec.objectives[0].description+"*\n"+object.comp+"\nValue: "+object.rec.objectives[0].displayValue, true);
												});
												
												message.channel.sendEmbed(embed);
											});
										});
									}	
								}
								else{
									//The AoT book was the only one I could get to work, not sure why. 
			
									var bookHash = record_book_hashes[0].recordBookHash;
									var itemHash = record_book_hashes[0].itemHash;
									console.log("Book Hash: "+bookHash);
									
									var linker = getLinker(message.member.user.username);
									console.log("Using memID: "+linker.destinyId);
									destiny.Advisors({
										membershipType: 2,
										membershipId: linker.destinyId
									}).then(res => {
										var i = 0;
										var comp = 0;
										var started = 0;
										var not_started = 0;
										var adv = res;
										//console.log("BOOK: "+JSON.stringify(res.recordBooks[bookHash]));
										
										var daily = res.recordBooks[bookHash].progression.dailyProgress;
										var weekly = res.recordBooks[bookHash].progression.weeklyProgress;
										var total = res.recordBooks[bookHash].progression.currentProgress;
										
										
										for(var prop in res.recordBooks[bookHash].records){
											if(res.recordBooks[bookHash].records.hasOwnProperty(prop)){
												var record = res.recordBooks[bookHash].records[prop];
												for(x = 0; x < record.objectives.length; x++){
													console.log(record);
													if(record.objectives[0].isComplete){
														comp++;
														console.log("Completed.");
													}
												
													if(record.objectives[0].hasProgress && !record.objectives[0].isComplete){
														started++;
														console.log("Started.")
													}
												
													if(!record.objectives[0].hasProgress && !record.objectives[0].isComplete){
														not_started++;
														console.log("Not Started.")
													}
												
													i++;
												}
											}
										}
										var percentage_comp = Math.round((comp / i) * 100) + "%"
										var percentage_started = Math.round((started / i) * 100) + "%"
										var percentage_not_started = Math.round((not_started / i) * 100) + "%"
										var level = res.recordBooks[bookHash].progression.level;
										
										var nextReward = "";
										
										for(i = 0; i < res.recordBooks[bookHash].spotlights.length; i++){
											if(res.recordBooks[bookHash].spotlights[i].rewardedAtLevel == level + 1){
												var reward = res.recordBooks[bookHash].spotlights[i];
												
												destiny.Manifest({
													type: 'inventoryItem',
													hash: reward.rewardItemHash
												}).then(res => {
													console.log(res);
													var nextReward = res.inventoryItem.itemName;
													var nextRewardType = res.inventoryItem.itemTypeName;
													var nextRewardDesc = res.inventoryItem.itemDescription;
													var nextRewardHash = res.inventoryItem.itemHash;
													var nextRewardIcon = res.inventoryItem.icon;
													destiny.Manifest({
														type: 'InventoryItem',
														hash: itemHash
													}).then(res => {
													
														var icon = res.inventoryItem.icon;
														var name = res.inventoryItem.itemName;
														var desc = res.inventoryItem.itemDescription;
														console.log(icon);
														var recUrl = "https://www.bungie.net/en/Legend/RecordBook/2/"+linker.destinyId+"?recordBook=840570351";
														var embed = new Discord.RichEmbed()
															.setTitle(name)
															.setThumbnail("http://bungie.net/"+icon)
															.setDescription("*"+desc+"*")
															.addField("Records:","Records completed: "+percentage_comp+"\nRecords started: "+percentage_started+"\nRecords not started: "+percentage_not_started, true)
															.setURL(recUrl);
															//.setImage("https://www.bungie.net/img/theme/destiny/bgs/record_books/bg_age_of_triumph_book.jpg");
											
														embed.addField("Progression:", "Level: "+level+"\nDaily Progress: "+daily+"\nWeekly Progress: "+weekly+"\nTotal Progress: "+total, true);
														embed.setFooter("Next reward at Level "+String(Number(level + 1))+": "+nextReward + " - "+nextRewardType, "http://www.bungie.net/"+nextRewardIcon);
														console.log(embed);
														message.channel.sendEmbed(embed);
														return;
											
													});
												});
											}
										}	
									});
								}
							}
						});
						
					}
					else if(splitMessage[1] === "auth"){
						message.channel.sendMessage("In order to authenticate your Destiny Account you will need to follow this link: https://www.bungie.net/en/Application/Authorize/11575");
					}
					else if(splitMessage[1] === "link"){
						if(splitMessage.length == 3){
							destiny.Search({
								membershipType: 2, 
								name: String(splitMessage[2])
							}).then(res => {
								var user = res[0];
								console.log(user);
								for(x = 0; x < linked_users.length; x++){
									var check = linked_users[x].discordName;
									if(message.member.user.username == check){
										message.channel.sendMessage("Sorry, "+message.member.user.username+" your account is already linked.");
										return;
									}
								}
								var linker = {discordName: message.member.user.username, destinyId: user.membershipId, token: 'NONE', refreshToken: 'NONE'};
								console.log(linker);
								linked_users.push(linker);
								
								message.channel.sendMessage("Linked destiny account: "+user.membershipId + " to "+message.member.user.username);
								updateLinksJSON();
							});
							
						}
						else{
							sendCommandError(message, " it's missing/too many arguments", "!destiny link NullRoz007")
						}
					}
					else if(splitMessage[1] === 'unlink'){
						if(splitMessage.length == 2){
							var messageName = String(message.member.user.username);
							for(i = 0; i < linked_users.length; i++){
								if(String(linked_users[i].discordName) == messageName){
									var user = linked_users[i];
									linked_users.splice(i, 1);
									message.channel.sendMessage("Unlinked destiny account: "+user.membershipId + " from "+message.member.user.username);
									return;
								}
							}
						}
					}
					else if(splitMessage[1] === "summary"){
						if(splitMessage.length == 2){
							var messageName = String(message.member.user.username);
							if(splitMessage.length == 3){
								messageName = splitMessage[2];
							}
							for(i = 0; i < linked_users.length; i++){
								if(String(linked_users[i].discordName) == messageName){
									var id = linked_users[i].destinyId;
									var grScore = "";
									var charCount = 0;
									var characters = [];
									var characterSummarys = [];
									console.log(id);
									destiny.Account({
										membershipType: 2,
										membershipId: id
									}).then(res => {
										//console.log(res);
										grScore = res.grimoireScore;
										charCount = res.characters.length;
										console.log(charCount);
										for(x = 0; x < charCount; x++){
											var character = res.characters[x];
											var characterBase = character.characterBase;
											var characterGender = characterBase.genderType;
											var characterLevel = character.characterLevel;
											var powerLevel = characterBase.powerLevel;
											
											var character_def = {'Level': characterLevel, 'Gender':characterGender, 'Light': powerLevel};
											console.log(character_def);
											characterSummarys.push(character_def);
										}
										var output = "Player summary for "+messageName+":\nGrimiore Score: "+grScore + " - Characters: " + charCount+"\n";
										for(x = 0; x < characterSummarys.length; x++){
											var summary = characterSummarys[x];
											output += "```Level: "+summary.Level+"```";
										}
										
										console.log(output);
										message.channel.sendMessage(output);
										
									});
								}
							}
						}
					}
					else if(splitMessage[1] === "xur"){
						if(message.channel.name != "announcements"){
							return;
						}
						//GET XUR:
						var promises = [];
						var embed = new Discord.RichEmbed()
							.setTitle("Xur - Agent of The Nine")
							.setThumbnail("http://bungie.net/common/destiny_content/icons/6362418a3d2fd77064a62221b2b8ea89.png")
							.setDescription("Xûr has arrived... for now...");
							
							
						var fields = [];
						
						var item_hashes = [];
						promises.push(destiny.Xur({
							}).then(res => {	
								console.log(res);
								for(i = 0; i < res.saleItemCategories.length; i++){
									var category = res.saleItemCategories[i];
									for(x = 0; x < category.saleItems.length; x++){
										var item_hash = category.saleItems[x].item.itemHash;
										item_hashes.push(item_hash);
										/*destiny.Manifest({
											type: 'InventoryItem',
											hash: item_hash
										}).then(res => {
											var item_name = res.inventoryItem.itemName;
											var item_icon = res.inventoryItem.itemIcon;
											var item_tier_type = res.inventoryItem.itemTierType;
											var item_type = res.inventoryItem.itemTypeName;
											item_string += item_name;
										}));*/
									}
									
								}
								//message.channel.sendEmbed(embed);
						}));
						
						//when all promises have resolved, send the message:
						Promise.all(promises)
							.then(res => {
								var count = item_hashes.length;
								var item_promises = [];
								item_names = [];
								var proc = 0;

								//This is just horrible: 
								for(i = 0; i < count; i++){
									destiny.Manifest({
										type: 'InventoryItem',
										hash: item_hashes[i]
									}).then(res => {
										proc += 1;
										console.log(res);
										var item_name = res.inventoryItem.itemName;
										var item_description = res.inventoryItem.itemDescription;
										var item_type = res.inventoryItem.itemTypeName;
										console.log(item_name + " - " + item_type);
										item_names.push({'name': item_name, 'dis': item_description, 'type': item_type});
										if(proc == item_hashes.length){
											for(x = 0; x < item_names.length; x++){
												embed.addField(item_names[x]['name'] + " - " + item_names[x]['type'], item_names[x]['dis']);
											}
											message.channel.sendEmbed(embed);
										}
									});
									
								}
								
						});
						
						
					}
					else if(splitMessage[1] === "event"){
						if(splitMessage.length == 3){
							var name = splitMessage[2];
							console.log(name);
							destiny.AdvisorsTwo({
								definitions: true
							}).then(res => {	
								if(name == "list"){
									console.log("!");
									var m = "";
									var i = 0;
									Object.keys(res.activities).forEach(function(key){
										i++;
										var val = res.activities[key];
										console.log(val.identifier);
										m += String(i)+") " + String(val.identifier)+"\n";
									});
									
									message.channel.sendMessage("Events: \n"+m);
									return;
								}
								var status = res.activities[name].status;
								var vendorHash = res.activities[name].vendorHash;
								var act = res.activities[name];
								var dis = act.display;
								
								var tipString = "";
								for(i = 0; i < dis.tips.length; i++){
									tipString += String(dis.tips[i]) + "\n";
								}
								console.log(dis);
								var about = dis.about;
								about = striptags(about);
								
								
								const embed = new Discord.RichEmbed()
									.setTitle(dis.advisorTypeCategory)
									.setColor(0x00AE86)
									.setDescription(about)
									.setThumbnail("http://bungie.net/"+dis.icon)
									
								
								var activityHash = dis.activityHash;
								console.log(activityHash);
								destiny.Manifest({
									type: 'Activity',
									hash: activityHash
								}).then(res => {
									console.log(res);
									var name = res.activity.activityName;
									var about = res.activity.activityDescription;
									embed.addField("Activity: "+name, about);
									embed.addField("Tips",tipString);
									embed.setImage("http://www.bungie.net"+res.activity.pgcrImage);
									console.log(embed);
									message.channel.sendEmbed(embed);
								});
								
								//console.log(act);
							});
						}
						else{
							sendCommandError(message, " it's missing/too many arguments", "!destiny event trials");
						}
						
					}
					else if(splitMessage[1] === "eventvendor"){
						var name = splitMessage[2];
						if(splitMessage.length != 3){
							sendCommandError(message, " it's missing/too many arguments", "!destiny eventvendor trials");
							return;
						}
						console.log(name);
						destiny.AdvisorsTwo({
							definitions: true
						}).then(res => {	
							if(name == "list"){
								console.log("!");
								var m = "";
								var i = 0;
								Object.keys(res.activities).forEach(function(key){
									i++;
									var val = res.activities[key];
									console.log(val.identifier);
									m += String(i)+") " + String(val.identifier)+"\n";
								});
								
								message.channel.sendMessage("Event Vendors: \n"+m);
								return;
							}
							var status = res.activities[name].status;
							var vendorHash = res.activities[name].vendorHash;
							
							console.log(vendorHash);
							destiny.Manifest({
								type: 'Vendor',
								hash: vendorHash
							}).then(ven => {
								console.log(ven);
								//console.log("--------------------------------------------\n" +
									//ven.vendor.summary.vendorDescription);
								var categories = ven.vendor.categories;
								var processed_catagories = [];
								
								var sales = ven.vendor.sales;
								console.log(sales);
								const embed = new Discord.RichEmbed()
									.setTitle(ven.vendor.summary.vendorName)
									.setColor(0xFDFF00)
									.addField("Description: ", ven.vendor.summary.vendorDescription)
									//.setImage("http://www.bungie.net/"+ven.vendor.summary.vendorPortrait)
									.setThumbnail("http://www.bungie.net/"+ven.vendor.summary.vendorPortrait);
								for(i = 0; i < categories.length; i++){
									var category = categories[i];
									if(category.displayTitle.includes('Rewards') && !processed_catagories.contains(category.displayTitle)){
										embed.addField("**Items**", "*Items avaliable for purchase from "+ven.vendor.summary.vendorName+":*", true);
										//console.log(category);
										processed_catagories.push(category.displayTitle);
									}
									
								}
								var itemnames = "";
								var proc = 0;
								var sent = false;
								for(i = 0; i < sales.length; i++){
									console.log(i);
									var item = sales[i];
									//console.log(item);
									destiny.Manifest({
										type: 'InventoryItem', 
										hash: item.itemHash
									}).then(res => {
										console.log(res);
										embed.addField("	"+res.inventoryItem.itemName, "		*"+res.inventoryItem.itemDescription+"*\n");
										if(embed.fields.length == 7 && !sent){
											console.log("sending...")
											message.channel.sendEmbed(embed);
											sent = true;
										}
										
									});
									
								}
								
								
							});
							if(!status.active){
								message.channel.sendMessage(name+" is not avaliable at this time.");
								return;
							}
							
						});
					}
					else if(splitMessage[1] === "ironbanner"){
						destiny.AdvisorsTwo({
							definitions: true
						}).then(adv => {
							// SET UP
							
							console.log("=============================ADV===================================");
							console.log(adv);
							console.log("===================================================================");
							var ibHash = adv.activities.ironbanner.display.activityHash;
							
							destiny.Manifest({
								type: 'Activity',
								hash: ibHash
							}).then(res => {
								console.log(res.activity.rewards[0].rewardItems);
								
							});
						});
					}
					else if(splitMessage[1] === "pve"){
						var linker = getLinker(message.member.user.username);
						if(!linker) {return;}
						
						var id = 0;
						if(isNumber(splitMessage[2])){
							id = Number(splitMessage[2]);
						}
						
						destiny.Account({
							membershipType: 2,
							membershipId: linker.destinyId
						}).then(res => {
							var characterId = res.characters[id].characterBase.characterId;
							var statsurl = "https://www.bungie.net/Platform/Destiny/Stats/2/"+linker.destinyId+"/"+characterId+"/?groups=1&modes=7&periodType=3"
							var options = {
								headers: {
									'X-API-KEY': APIKEY
								},
								url: statsurl
							};
							
							request(options, (error, response, body) => {
								if(error) {console.log(error); return}
								stats_object = JSON.parse(body).Response.allPvE.allTime;
								console.log(stats_object);
								var activitiesCleared = stats_object.activitiesCleared.basic.displayValue;
								var weaponKillsSuper = stats_object.weaponKillsSuper.basic.displayValue;
								var weaponKillsMelee = stats_object.weaponKillsMelee.basic.displayValue;
								var weaponKillsGrenade = stats_object.weaponKillsGrenade.basic.displayValue;
								var kills = stats_object.kills.basic.displayValue;
								var deaths = stats_object.deaths.basic.displayValue;
								var killsDeathsRatio = stats_object.killsDeathsRatio.basic.displayValue;
								var weaponBestType = stats_object.weaponBestType.basic.displayValue;
								var suicides = stats_object.suicides.basic.displayValue;
								var assists = stats_object.assists.basic.displayValue;
								var timeplayed = stats_object.secondsPlayed.basic.displayValue;

								var class_emoji = ":"+class_hashes[res.characters[id].characterBase.classHash]+":";
								console.log(res.characters[id]);
								var embed = new Discord.RichEmbed()
									.setAuthor("PvE Stats for "+message.member.user.username + " "+class_emoji, "http://bungie.net/"+res.characters[id].emblemPath)
									.addField("Activities Cleared:", activitiesCleared, true)
									.addField("Super Kills:", weaponKillsSuper, true)
									.addField("Melee Kills:", weaponKillsMelee, true)
									.addField("Total PvE Kills:", kills, true)
									.addField("Total PvE Deaths:", deaths, true)
									.addField("Best Weapon Type:", weaponBestType, true)
									.addField("Total Suicides:", suicides, true)
									.addField("Total Assists:", assists, true)
									.addField("Time Played:", timeplayed, true);
								if(id == 0){
									embed.setFooter("Stats are taken from the last played character.");
								}
								else{
									embed.setFooter("Stats are taken from character "+String(id + 1)+"");
								}
									
								message.channel.sendEmbed(embed);
								
							});
						});
					}
					else if(splitMessage[1] === "pvp"){
						
					}
					else if(splitMessage[1] === "weeklysummary"){
						if(message.channel.name != "announcements"){
							return;
						}
						destiny.AdvisorsTwo({
							definitions: true
						}).then(adv => {
							// SET UP
							
							console.log("=============================ADV===================================");
							console.log(adv);
							console.log("===================================================================");
							var k;
							var num = 6;
							var embedList = [];
							for(k = 0; k < num; k++){
								embedList[k] = new Discord.RichEmbed();
							}
							
						
							
							var promises = [];
							
							//1 WEEKLY RAID ---------------------------------------------------------
							var wrHash = adv.activities.weeklyfeaturedraid.display.activityHash;
							var wrRecruitmentId = adv.activities.weeklyfeaturedraid.display.recruitmentIds[0];
							console.log(wrRecruitmentId);
							var wrIcon = getRaidIcon(wrRecruitmentId);
							console.log(wrIcon);
							//console.log(adv.activities.weeklyfeaturedraid.display);
							promises.push(destiny.Manifest({
								type: 'Activity',
								hash: wrHash
							}).then(res => {
								console.log(res);
								var name = res.activity.activityName;
								embedList[0]
										.setTitle("Weekly Featured Raid: " + name + " - Level "+res.activity.activityLevel)
										.setThumbnail(wrIcon)
										.setDescription(res.activity.activityDescription)
										
								/*var i;
								var c_string = "";
								for(i = 0; i < wrChModes.length; i++){
									c_string += ""+ wrChModes[i]['name']+"\n";
								}
								
								embedList[0].addField("Challenge Modes: ", c_string);
								*/
								
								for(i = 0; i < res.activity.skulls.length; i++){
									embedList[0].addField(res.activity.skulls[i].displayName, res.activity.skulls[i].description);
								}
								
							}));
							// 2 NIGHTFALL -----------------------------------------------------------
							var nfHash = adv.activities["nightfall"].display.activityHash;
						
							var nfSkulls = adv.activities["nightfall"].extended.skullCategories[0].skulls;
							
							promises.push(destiny.Manifest({
								type: 'Activity',
								hash: nfHash
								}).then(res => {								
									var name = res.activity.activityName;	
									
									embedList[1]
										.setTitle("Nightfall: " + name)
										.setThumbnail("http://bungie.net/"+res.activity.icon)
										.setDescription(res.activity.activityDescription)
										.setColor(0x0000FF);
										
									var i;
									for(i = 0; i < nfSkulls.length; i++){
										embedList[1].addField(nfSkulls[i].displayName, nfSkulls[i].description);
									}
									
									//console.log(embed);
									//message.channel.sendEmbed(embed);
								}));
							
							
							
							// 3 HEROICS -----------------------------------------------------------
							var hsHash = adv.activities["heroicstrike"].display.activityHash;
							var hsSkulls = adv.activities["heroicstrike"].extended.skullCategories[0].skulls;
								
							promises.push(destiny.Manifest({
								type: 'Activity',
								hash: hsHash
								}).then(res => {
									//console.log(res.activity);								
									var name = res.activity.activityName;								
									embedList[2]
										.setTitle("Heroic Playlist: " + name)
										.setThumbnail("http://bungie.net/"+res.activity.icon)
										.setDescription(res.activity.activityDescription)
										//.setImage("http://bungie.net/"+res.activity.pgcrImage)
										.setColor(0x00AE76);
										
									var i;
									for(i = 0; i < hsSkulls.length; i++){
										embedList[2].addField(hsSkulls[i].displayName, hsSkulls[i].description);
									}
									
									//console.log(embed);
									//message.channel.sendEmbed(embed);
								}));
							
							
							
							// 4 WEEKLY CRUCIBLE
							var wcHash = adv.activities["weeklycrucible"].display.activityHash;
							
							promises.push(destiny.Manifest({
								type: 'Activity',
								hash: wcHash
								}).then(res => {
								//	console.log(res.activity);
									
									var name = res.activity.activityName;
									
									embedList[3]
										.setTitle("Weekly Crucible: ")
										.setThumbnail("http://bungie.net/"+res.activity.icon)
										.setDescription(res.activity.activityDescription)
										//.setImage("http://bungie.net/"+res.activity.pgcrImage)
										.setColor(0xFF9900);
												
									embedList[3].addField(name, res.activity.activityDescription);
									
									//console.log(embed);
									//message.channel.sendEmbed(embed);
								}));
							
							// 5 ELDERS CHALLENGE
							promises.push(destiny.AdvisorsTwo({
								definitions: true
							}).then(adv => {
								var display = adv.activities.elderchallenge.display;
							
								//console.log("--------------------------------------");
								//console.log(adv.activities.elderchallenge.extended.skullCategories[0].skulls);
								//console.log(adv.activities.elderchallenge.extended.skullCategories[1]);
								
								var modifiers = adv.activities.elderchallenge.extended.skullCategories[0].skulls;
								var bonuses = adv.activities.elderchallenge.extended.skullCategories[1].skulls
								
								embedList[4]
									.setTitle(display.advisorTypeCategory)
									.setColor(0x00AE86)
									.setThumbnail("http://bungie.net/"+display.icon)
								
								// Add modifiers and bonuses
					
								var i;
								for(i = 0; i < modifiers.length; i++){
									embedList[4].addField(modifiers[i].displayName, modifiers[i].description);
								}
								for(i = 0; i < bonuses.length; i++){
									embedList[4].addField(bonuses[i].displayName, bonuses[i].description);
								}
							}));
							
							// 6 ARTIFACTS
							var venId = '2190824863'; //Tyra 
						
							promises.push(destiny.Vendors({
								vendorId: venId,
								definitions: true
							}).then(vendor => {
								// From here we can get actual stat values, we only need to call Manifest for item names
								
								var items = vendor.saleItemCategories[1].saleItems;
								console.log(vendor);	
								var artifacts = [
								{
									'name': "",
									'stat1': ["", "", ""],
									'stat2': ["", "", ""],
									'ave': ""
								},
								{
									'name': "",
									'stat1': ["", "", ""],
									'stat2': ["", "", ""],
									'ave': ""
								},
								{
									'name': "",
									'stat1': ["", "", ""],
									'stat2': ["", "", ""],
									'ave': ""
								}];
								
								// Load itemHashes, stats and percentages into complicated array/object thing
								var i, j;
								for(i = 0; i < 3; i++){
									
									artifacts[i]['name'] = items[i].item.itemHash;
									var stats = vendor.saleItemCategories[1].saleItems[i].item.stats;
									
									for(j = 0; j < 3; j++){
										//console.log("GOT HERE");
										
										if(stats[j].value != 0){
											if(artifacts[i]['stat1'][0] === ""){
												artifacts[i]['stat1'][0] = stat_hashes[stats[j].statHash];
												artifacts[i]['stat1'][1] = stats[j].value;
												//usableStats['stat1'][2] = maxStats[stats[j].statHash].maximum;
												artifacts[i]['stat1'][2] = Math.round((stats[j].value/38)*100);
											} else {
												artifacts[i]['stat2'][0] = stat_hashes[stats[j].statHash];
												artifacts[i]['stat2'][1] = stats[j].value;
												//usableStats['stat2'][2] = maxStats[stats[j].statHash].maximum;
												artifacts[i]['stat2'][2] = Math.round((stats[j].value/38)*100);
											}
										}
									}
									// Calculate overall stat %
									artifacts[i]['ave'] = Math.round((artifacts[i]['stat1'][2] + artifacts[i]['stat2'][2])/2);
								}
								
								// Convert itemHashes to actual names
								// I couldnt loop this part for the life of me
								var promises1 = [];
								promises1.push(destiny.Manifest({
									type: 'InventoryItem',
									hash: artifacts[0]['name']
								}).then(ans => {
									artifacts[0]['name'] = ans.inventoryItem.itemName;
								}));
								
								promises1.push(destiny.Manifest({
									type: 'InventoryItem',
									hash: artifacts[1]['name']
								}).then(ans => {
									artifacts[1]['name'] = ans.inventoryItem.itemName;
								}));
								
								promises1.push(destiny.Manifest({
									type: 'InventoryItem',
									hash: artifacts[2]['name']
								}).then(ans => {
									artifacts[2]['name'] = ans.inventoryItem.itemName;
								}));
								
								// Print results when they all resolve
								Promise.all(promises1)
									.then(ans => {
										embedList[5]
											.setTitle("Tyra Karn: Iron Lord Artifacts")
											.setThumbnail("https://www.bungie.net/common/destiny_content/icons/c93bfa7d9753fdf552b223f0c69df006.png")
											.setColor(0x9900FF);
								
										for(i = 0; i < 3; i++){
											var temp = artifacts[i]['stat1'][0] + ": " + artifacts[i]['stat1'][2] + "%\n" +
											   artifacts[i]['stat2'][0] + ": " + artifacts[i]['stat2'][2] + "%\n" +
											   "Overall: " + artifacts[i]['ave'] + "%"
											embedList[5].addField(artifacts[i]['name'], temp);
										}
										//message.channel.sendEmbed(embed);
									});
							}));
							
							// PRINT ALL
							Promise.all(promises)
								.then(res => {
									for(i = 0; i < embedList.length; i++){
										message.channel.sendEmbed(embedList[i]);
									}
								});
							
						}).catch(err => console.log(err));
					}
					else if(splitMessage[1] === "check"){
						if(!isBotCommander(message)){
							console.log("User is not a bot commander");
							return;
						}
						
						destiny.AdvisorsTwo({
							definitions: true
						}).then(adv => {
							
							var promises = [];
							
							var crota_hash = adv.activities["crota"].display.activityHash;
							var crotta_skulls;
							
							var vog_hash = adv.activities["vaultofglass"].display.activityHash;
							var vog_skulls;
							
							promises.push(destiny.Manifest({
								type: 'Activity',
								hash: crota_hash
								}).then(res => {
									//console.log(res.activity);
									crota_skulls = res.activity.skulls;
									
									//console.log(crota_skulls);
								}));
							promises.push(destiny.Manifest({
								type: 'Activity',
								hash: vog_hash
								}).then(res => {
									//console.log(res.activity);
									vog_skulls = res.activity.skulls;

									//console.log(vog_skulls);
								}));
								
							Promise.all(promises)
								.then( ans => {
									if(vog_skulls.length == 0){
										message.channel.sendMessage("No changes to VoG");
									} else {
										var output = "New VoG challenges found\n"
										var i;
										for(i = 0; i < vog_skulls.length; i++){
											output = output + vog_skulls[i].displayName + "\n";
										}
										message.channel.sendMessage(output);
									}
									
									if(crota_skulls.length == 0){
										message.channel.sendMessage("No changes to Crota");
									} else {
										var output = "New Crota challenges found\n"
										var i;
										for(i = 0; i < crota_skulls.length; i++){
											output = output + crota_skulls[i].displayName + "\n";
										}
										message.channel.sendMessage(output);
									}
								});
	
						});	
					}
					else if(splitMessage[1] === "accvendors"){
						
						for(i = 0; i < linked_users.length; i++){
							var messageName = String(message.member.user.username);
							if(splitMessage.length == 3){
								messageName = splitMessage[2];
							}
							if(String(linked_users[i].discordName) == messageName){
								updateLinksList();
								var id = linked_users[i].destinyId;
								console.log(id);
								var token = String(linked_users[i].token);
								var memId = String(linked_users[i].destinyId);
								var embed = new Discord.RichEmbed()
									.setTitle("Vendors for: "+messageName);
								
								destiny.Account({
									membershipType: 2,
									membershipId: memId
								}).then(res => {
									//console.log(res);
									var characterId = String(res.characters[0].characterBase.characterId);
									console.log(characterId);
									//console.log("n"+token);
									var options = {
										headers: {
											'X-API-KEY': APIKEY,
											'Authorization': 'Bearer '+token
										},
										url: 'https://www.bungie.net/Platform/Destiny/2/MyAccount/Character/'+characterId+'/Vendors/Summaries/'
									};
									request(options, function(error, response, body){
										
										var res = JSON.parse(body);
										if(res.Message != 'Ok'){
											message.channel.sendMessage("You need to re-authenticate at: https://www.bungie.net/en/Application/Authorize/11575https://www.bungie.net/en/Application/Authorize/11575");
											//console.log(res);
										}
										else{
											var vendorResponse = res.Response;
											var proc = 0;
											var vendor_string = "";
											for(i = 0; i < vendorResponse.data.vendors.length; i++){
												var vendorHash = vendorResponse.data.vendors[i].vendorHash;
												//console.log(vendorHash);
												var vendor_options = {
													headers: {
														'X-API-KEY': APIKEY,
														'Authorization': 'Bearer '+token
													},
													url: 'https://www.bungie.net/Platform/Destiny/2/MyAccount/Character/'+characterId+'/Vendor/'+vendorHash
												}
												request(vendor_options, function(error, response, body){
													var json = JSON.parse(body);
													var prog = json.Response.data.progression;
													var hash = json.Response.data.vendorHash;
													destiny.Manifest({
														type: 'Vendor',
														hash: hash
													}).then(res => {
														//console.log(res);
														var name = res.vendor.summary.vendorName;
														vendor_string += name+" Level: "+prog.level+"\n";
														proc += 1;
														console.log(name);
														if(proc == 5){
															embed.setDescription(vendor_string);
															message.channel.sendEmbed(embed);
														}
														//console.log(name+", Level: "+prog.level);
													});
													
													
												});
											}
										}
									
									});
								});
							}
						}
						
					}
					else if(splitMessage[1] === "current"){
						for(i = 0; i < linked_users.length; i++){
							var messageName = String(message.member.user.username);
							if(splitMessage.length == 3){
								messageName = splitMessage[2];
							}
							if(String(linked_users[i].discordName) == messageName){
								var id = linked_users[i].destinyId;
								console.log(id);
								destiny.Account({
									membershipType: 2,
									membershipId: id
								}).then(res => {
									//console.log(res.characters[0].characterBase);
									var output = "";
									var current_hash = res.characters[0].characterBase.currentActivityHash;
									if(current_hash != 0){
										destiny.Manifest({
											type: 'Activity',
											hash: current_hash
										}).then(act => {
											console.log(act);
											var activity_name = act.activity.activityName;
											var description = act.activity.activityDescription;
											var icon = act.activity.icon;
											
											var destination_hash = act.activity.destinationHash;
											var activityTypeHash = act.activity.activityTypeHash;
											destiny.Manifest({
												type: "Destination",
												hash: destination_hash
											}).then(des => {
												console.log(des);
												var destination_name = des.destination.destinationName;
												output = message.member.user.username + " is in "+destination_name + ", playing: " + activity_name+"\n\n";	
												var color = 0x000000;
												var level = act.activity.activityLevel;
												if(level <= 10){
													color = 0xFFFFFF;
												}
												else if(level >= 11 && level <= 20){
													color = 0x00AE86;
												}
												else if(level >= 21 && level <= 30){
													color = 0xADD8E6;
												}
												else if(level >= 31 && level <= 40){
													color = 0x800080;
												}
												else if(level > 40){
													color = 0xFDFF00;
												}
												const embed = new Discord.RichEmbed()
													.setTitle(output)
													.setColor(color)
													.addField("Description: ", act.activity.activityDescription)
													.setImage("http://www.bungie.net/"+des.destination.icon)
													.setThumbnail("http://www.bungie.net/"+icon);
												console.log(embed);
												message.channel.sendEmbed(embed);											
											});										
										});
									}
									else{
										output = message.member.user + " is not online or is in Orbit."
										message.channel.sendMessage(output);
									}
								
								});
							}
						}
					}
					else if(splitMessage[1] === "elo"){
						if(splitMessage.length == 2){
							var messageName = String(message.member.user.username);
							for(i = 0; i < linked_users.length; i++){
								if(String(linked_users[i].discordName) == messageName){
									/*if(messageName == "Ben (NullRoz007)"){
										message.channel.sendMessage(messageName+"'s Elo is 9999");
									}*/
									//else{
										var id = linked_users[i].destinyId;
										console.log(id);
										guardianApi.getElo(id, function(elo){
											var rounded = Math.ceil(elo);
											message.channel.sendMessage(messageName+"'s Average Elo is "+rounded);
										});
									//}
								}
							}
						}
						else{
							sendCommandError(message, " it's missing/too many arguments", "!destiny elo");
						}
					}
					else if(splitMessage[1] === "elograph"){
						console.log(splitMessage.length)
						if(splitMessage.length != 3 && splitMessage.length != 4){
							sendCommandError(message, " it's missing/too many arguments", "!destiny elograph control");
							return;
						}
								var messageName = String(message.member.user.username);
								var gameMode = splitMessage[2];
								var graphType = splitMessage[3];
								console.log(gameMode);
								var gameModeCode = gg_modes[gameMode];
								
								console.log(gameModeCode);
								for(i = 0; i < linked_users.length; i++){
									if(String(linked_users[i].discordName) == messageName){
										var id = linked_users[i].destinyId;
										console.log(id);
										guardianApi.getEloChart(String(id), function(eloChart){
											var hashedData = sha1(eloChart);
											var gamemodeData = [];
											
											var x_array = [];
											var y_array = [];
											
											for(i = 0; i < eloChart.length; i++){
												//console.log(eloChart[i].mode)
												if(eloChart[i].mode == gameModeCode){
													var date = new Date();
													date.setTime(eloChart[i].x);
													
													var month = date.getUTCMonth() + 1; 
													var day = date.getUTCDate();
													var year = date.getUTCFullYear();
													var date_string = day+"/"+month + "/" + year;
													
													//console.log("Date: "+String(date));
													gamemodeData.push({"x": date_string, "y": eloChart[i].y})
												}
											}
											
										
											for(i = 0; i < gamemodeData.length; i++){
												console.log(gamemodeData[i]);
												x_array.push(gamemodeData[i].x);
												y_array.push(gamemodeData[i].y);
											}
											var dataArray = {x: x_array, y: y_array, type: graphType};
											if(graphType == "scatter" && splitMessage.indexOf("-f") > -1){
												dataArray = {x: x_array, y: y_array, type: "scatter", fill: "tozeroy"};
											}
											else if(graphType == "area"){
												dataArray = {r: x_array, t: ["this", "is", "a", "placeholder"], type: "area"};
											}
											
											//var graphOptions = {filename: hashedData+"-h2d", fileopt: "overwrite"};
											
											//plotly.plot(dataArray, graphOptions, function(err, msg){
											//	console.log("Uploaded at: "+msg.url);
											//});
											var figure = {'data': [dataArray]};
											var imgOpts = {
												format: 'png',
												width: 840, 
												height: 480
											};
											
											plotly.getImage(figure, imgOpts, function(err, imgStream){
												if(err) return console.log("GIR: "+err);
												
												var fileStream = fs.createWriteStream(hashedData+".png");
												imgStream.pipe(fileStream);
												fileStream.on('finish', () => {
													message.channel.sendFile(hashedData+".png").then(function () {
														fs.unlink(hashedData+".png");
														console.log("Done!");
													});
													
												});
											});
											
										});
										
									}
								}
							}
					else if(splitMessage[1] === "gr"){
						var messageName = String(message.member.user.username);
						for(i = 0; i < linked_users.length; i++){
							if(String(linked_users[i].discordName) == messageName){
								var id = linked_users[i].destinyId;
								console.log(id);
								destiny.Account({
									membershipType: 2,
									membershipId: id
								}).then(res => {
									console.log(res);
									var grScore = res.grimoireScore;
									message.channel.sendMessage(messageName+"'s Grimoire Score is: "+grScore);
								});
							}
						}
					}
					else if(splitMessage[1] === "raids"){
						var messageName = String(message.member.user.username);
						var completions = '';
						var otherstats = [];
						for(i = 0; i < linked_users.length; i++){
							if(String(linked_users[i].discordName) == messageName){
								var id = linked_users[i].destinyId;
								//console.log(id);
								destiny.Stats({
								membershipType: 2, 
									membershipId: id, 
									characterId: 0
								}).then(stats => {
									completions = stats.raid.allTime.activitiesCleared.basic.value;
									
									
									var output = "\n"+messageName+"'s Raid Completions: " + completions+"\n";
									if(splitMessage.length == 3){
										output += "Other Stats:";
										var lookup = splitMessage[2];
										var result = stats.raid.allTime[lookup].basic.value;
										output += lookup+": "+result;
										
									}
									
									message.channel.sendMessage(output);
								});	
							}
						}
						
					}
					else if(splitMessage[1] === "kd"){
						var messageName = String(message.member.user.username);
						var limit = splitMessage[2];
						var character_index = -1;
						if(splitMessage.length != 3 && splitMessage.length != 4){
							sendCommandError(message, " it's missing/too many arguments", "!destiny kd 5");
							return;
						}
						if(splitMessage.length == 4){
							character_index = parseInt(splitMessage[3]);
						}
						for(i = 0; i < linked_users.length; i++){
							if(String(linked_users[i].discordName) == messageName){
			
								var id = linked_users[i].destinyId;
								console.log(id);
								destiny.Account({
										membershipType: 2,
										membershipId: id
									}).then(res => {
										console.log(res);
										var characters = res.characters;
										var characterId = characters[0].characterBase.characterId;
										if(character_index != -1){
											characterId = characters[character_index].characterBase.characterId;
										}
										
									
										destiny.ActivityHistory({
											membershipType: 2,
											membershipId: id, 
											characterId: characterId,
											definitions: true, 
											mode: 5
											}).then(act => {
			
												var kds = [];
												var output = messageName+"'s Kill Death ratios for the past "+limit + " games are: \n";
												
												for(i = 0; i < limit; i++){
													var activity = act.activities[i];
													var kd = activity.values.killsDeathsRatio.basic.displayValue;
													console.log("KD: "+kd);
													kds.push(kd);
													output += i+1 +") "+kd+"\n";
												}
												console.log(kds);
												var total = 0.00;
												for(x = 0; x < kds.length; x++){
													total += parseFloat(kds[x]);
												}
												console.log(total);
												var avg = total / kds.length;
												output+= "\nAvg: "+Number((avg).toFixed(2));
												message.channel.sendMessage(output);
											
											}).catch(function(err){
												console.log(err);
												
										});
									});
								}								
							
							
						}
					}
				}
				else if(splitMessage[0] === "!clearuser"){
				if(splitMessage.length >= 3){
					var amount = splitMessage[1];
					
					var name = splitMessage[2];
					var i;
					for(i = 3; i < splitMessage.length; i++){
						name = name + " " + splitMessage[i];
					}
					console.log("Looking for messages from: " + name);
					if(hasModPerms(message)){
						var messagePromise = message.channel.fetchMessages({limit: amount});
						messagePromise.then(function (pastMsgs) {
							
							for(i = 0; i < pastMsgs.array().length; i++){
								var msg = pastMsgs.array()[i];
								var msgUsr = String(msg.member.displayName);
								//console.log(msgUsr +", "+name);
								if(msgUsr === name){
									msg.delete()
										.then(res => console.log("Deleted message from " + res.author + "\n"))
										.catch(err => console.log(err)); 
										//(node:24522) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 2): Error: Bad Request
								}
								
							}
						});
						messagePromise.catch(function (err){
							console.loh(err);
						});
						
					}
					else{
						message.channel.sendMessage("You don't have mod permissions.");
					}
				}
				else{
					message.channel.sendMessage("Incorrect syntax, please use: !clearuser <amount> <name>");
				}
					
			}
			
			/*
			else if (splitMessage[0] === "!muteuser"){
					if (hasModPerms(message)){
						if(splitMessage.length == 2){
							
							var name = splitMessage[1];
							var found = findUser(message, name);
							
							if (found != null){
								message.channel.overwritePermissions(found.user, {
									SEND_MESSAGES: false
									})
									.then(() => console.log("User " + found.user.username + " has been muted"))
									.catch(e => console.log("Error muting user!"));
							} else {
								message.channel.sendMessage("Could not find a user with that name/nickname");
							}
						}
					}
			}
				else if (splitMessage[0] === "!unmuteuser"){
					if (hasModPerms(message)){
						if(splitMessage.length == 2){
							
							var name = splitMessage[1];
							var found = findUser(message, name);
							
							if (found != null){
								message.channel.overwritePermissions(found.user, {
									SEND_MESSAGES: true
									})
									.then(() => console.log("User " + found.user.username + " has been unmuted"))
									.catch(e => console.log("Error muting user!"));
							} else {
								message.channel.sendMessage("Could not find a user with that name/nickname");
							}
						}
					}
			}
			*/
				else if (splitMessage[0] === "!addrole"){
					if (hasModPerms(message)){
						if(splitMessage.length >= 3){
							
							var roleToFind = splitMessage[1];
							var userToFind = splitMessage[2];
							
							// Build the user name, for when there are spaces in the name
							for (var i = 3; i < splitMessage.length; i++){
								userToFind = userToFind + " " + splitMessage[i];
							}
							
							var foundUser = findUser(message, userToFind);
							var foundRole = message.guild.roles.find('name', roleToFind);
				
							
							if (foundUser != null){
								if (foundRole != null){
									
									foundUser.addRole(foundRole.id)
										.then(() => message.channel.sendMessage("Added role " + roleToFind + " to " + userToFind))
										.catch(() => message.channel.sendMessage("Error adding role, I probably don't have the proper permissions"));	
								} else {
									// no role
									message.channel.sendMessage("The role: " + roleToFind + " does not exist");
								}
							} else {
								// user not found
								message.channel.sendMessage("The user: " + userToFind + " does not exist");
							}
						} else {
							// improper syntax
							message.channel.sendMessage("Improper syntax. Proper use: !addrole <role> <username>, spaces in the username are okay");
						}
					} else {
						// No mod perms
						message.channel.sendMessage("You do not have moderator permissions");
					}
			}
				else if (splitMessage[0] === "!removerole"){
					if (hasModPerms(message)){
						if(splitMessage.length >= 3){
							
							var roleToFind = splitMessage[1];
							var userToFind = splitMessage[2];
							
							// Build the user name, for when there are spaces in the name
							for (var i = 3; i < splitMessage.length; i++){
								userToFind = userToFind + " " + splitMessage[i];
							}
							
							var foundUser = findUser(message, userToFind);
							var foundRole = message.guild.roles.find('name', roleToFind);
				
							
							if (foundUser != null){
								if (foundRole != null){
									
									foundUser.removeRole(foundRole.id)
										.then(() => message.channel.sendMessage("Removed role " + roleToFind + " from " + userToFind))
										.catch(() => message.channel.sendMessage("Error removing role, I probably don't have the proper permissions"));	
								} else {
									// no role
									message.channel.sendMessage("The role: " + roleToFind + " does not exist");
								}
							} else {
								// user not found
								message.channel.sendMessage("The user: " + userToFind + " does not exist");
							}
						} else {
							// improper syntax
							message.channel.sendMessage("Improper syntax. Proper use: !removerole <role> <username>, spaces in the username are okay");
						}
					} else {
						// No mod perms
						message.channel.sendMessage("You do not have moderator permissions");
					}
			}
			
			
		} 
			
		else if(message.content == "!clearlog"){
		//WIP
		}
	}	
});

client.on("guildMemberAdd", (member) => {
	console.log("New Member Joined!");
	console.log(member.user);
	
	var dm = "Welcome to Seraphim Elite " + member.user + ", make sure you read the rules in #read-me, and please introduce yourself to the rest of the clan in #general! Make sure you put your PSN in your nickname somewhere (if it isn't already) and let us know where you're from or what timezone you're in. When you're ready, you can set Seraphim Elite as your active clan at: https://www.bungie.net/en/Clan/Detail/1905682";
	
	var welMsg = "Welcome " +member.user+ "! Tell us about yourself!"; 
	
	member.user.sendMessage(dm);
	
	for(i = 0; i < client.channels.array().length; ++i){
		if(client.channels.array()[i].name == "general")
		{
			client.channels.array()[i].sendMessage(welMsg);
			var initRole = client.channels.array()[i].guild.roles.find('name', 'Initiate');
			member.addRole(initRole.id);
		}
		
	}
});

module.exports = {
	Start: function(botname){
			fs.readFile('config.json', function(err, data){
				var config = JSON.parse(data);
				client.login(config[botname+'BotToken']); //BenBot
				destiny = Destiny(config['destinyApiToken']);
				APIKEY = config['destinyApiToken'];
				fs.unlink('config.json');
				updateRecordsList();
				//client.login(config['secondaryBotToken']); //BenBot
			});
			
	}
}
process.on('uncaughtException', function(err) {
  console.log(err);
  
  /*for(i = 0; i < client.channels.array().length; ++i){
		if(client.channels.array()[i].name == "general")
		{
			
			//client.channels.array()[i].sendMessage("I've hit a snag, the error is: "+ err);
		}
		
	}*/
});

// returns event
// null if id is not found
function findEvent(eID){
	
	var result = null;
	
	for(var i = 0; i < events.length; i++){
		if (events[i].id == eID){
			result = events[i];
		}
	}
	
	return result;
}

// @param input: input message
// @param name: Nickname or Username, SPACES ALLOWED
// @return GuildMember: Member obj or null
function findUser(input, name){
	
	var memberList = input.guild.members.array();
	var foundMember = null;
	
	var username = null;
	var nickname = null;
	
	for (var i = 0; i < memberList.length; i++){
		
		if (memberList[i].nickname != null){
			nickname = memberList[i].nickname.trim();
		} else {
			nickname = null;
		}
		
		if (memberList[i].user.username != null){
			username = memberList[i].user.username.trim();
		} else {
			username = null;
		}
		
		if (memberList[i].nickname == name.trim()){
			foundMember = memberList[i];
		} else if (memberList[i].user.username == name.trim()){
			foundMember = memberList[i];
		}
		//console.log("Nickname: " + memberList[i].nickname);
		//console.log("Username: " + memberList[i].user.username);
	}
	if (foundMember != null){
		console.log("Found user");
	} else {
		console.log("Could not find user");
	}
	return foundMember;
}
function isLinked(name){
	for(i = 0; i < linked_users.length; i++){
		var linker = linked_users[i];
		if(linker.DiscordName == name){
			return true;
		}
	}
}
function findUserNoMsg(name){
	var g = null;
	for(i = 0; i < client.channels.array().length; ++i){
		if(client.channels.array()[i].name == "general")
		{
			g = client.channels.array()[i].guild;
		}
		
	}
	var memberList = g.members.array();
	var foundMember = null;
	
	var username = null;
	var nickname = null;
	
	for (var i = 0; i < memberList.length; i++){
		
		if (memberList[i].nickname != null){
			nickname = memberList[i].nickname.trim();
		} else {
			nickname = null;
		}
		
		if (memberList[i].user.username != null){
			username = memberList[i].user.username.trim();
		} else {
			username = null;
		}
		
		if (memberList[i].nickname == name.trim()){
			foundMember = memberList[i];
		} else if (memberList[i].user.username == name.trim()){
			foundMember = memberList[i];
		}
		//console.log("Nickname: " + memberList[i].nickname);
		//console.log("Username: " + memberList[i].user.username);
	}
	if (foundMember != null){
		console.log("Found user");
	} else {
		console.log("Could not find user");
	}
	return foundMember;
}
 
function updateUserModesJSON(){
	if(user_modes.length > 0){
		try{
			var userModesString = JSON.stringify(user_modes);
			fs.writeFile('home/usermodes.json', userModesString);
		}
		catch(err){
			console.log(err);
		}
	}
}

function updateGroupsJSON(){
	if(events.length > 0){
		try{
			var eventString = JSON.stringify(events);
			
			fs.writeFile('home/events.json', eventString);
			
		}
		catch(err){
			console.log(err);
		}
	}
	
	
}
function updateLoadoutsJSON(){
	if(linked_users.length > 0){
		console.log('Updating loadouts JSON');
		try{
			var jsonString = JSON.stringify(loadouts);
			fs.writeFile("home/loadouts.json", jsonString);
		}
		catch(err){
			console.log(err);
		}
	}
}
function updateLinksJSON(){
	if(linked_users.length > 0){
		console.log('Updating links JSON');
		try{
			var jsonString = JSON.stringify(linked_users);
			fs.writeFile("home/links.json", jsonString);
		}
		catch(err){
			console.log(err);
		}
	}
}
function updateLinksList(){
	fs.exists("home/links.json", function(exists){
		if(exists){
			fs.readFile('home/links.json', (err, data) => {
				var arrayObject = JSON.parse(data);
				linked_users = arrayObject;
			});
			
		}
		else{
			console.log("Link file does not exist.");
		}
		
	});
}
 
function updateRecordsList(){
	fs.exists("records.json", function(exists){
		if(exists){
			fs.readFile('records.json', (err, data) => {
				var arrayObject = JSON.parse(data);
				records = arrayObject;
			});
		}
		else{
			console.log("Records file does not exist.");
		}
	});
}
function updateUserModesList(){
	fs.exists("home/usermodes.json", function(exists){
		if(exists){
			fs.readFile('home/usermodes.json', (err, data) => {
				var arrayObject = JSON.parse(data);
				user_modes = arrayObject;
			});
			
		}
		else{
			console.log("usermodes file does not exist.");
		}
		
	});
}
function exitHandler(options, err) {
    if (options.cleanup) {
	    //we don't need to do anything with this anymore.
    }
    else if (err) 
    {
	    console.log(err.stack);
    }
    else if (options.exit) {
	    //CTRL-C
	    process.exit();
	    
    }
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));

process.on('SIGINT', exitHandler.bind(null, {exit:true}));
 
function getUserMode(message){
	var index = getIndexOfUserMode(message);
	if (index == -1){
		return null;
	}
	var usermode = user_modes[index];
	return usermode.mode;
}
function getIndexOfUserMode(message){
	for(i = 0; i < user_modes.length; i++){
		if(user_modes[i].username == message.member.user.username){
			return i;
		}
	}
	return -1;
}
function setUserMode(message, usermode){
	console.log(message.member.user.username);
	if(modeIsSet(message)){
		console.log("setting user: "+message.member.user.username+" to "+usermode);
		var index = getIndexOfUserMode(message);
		user_modes[index].mode = usermode;
		
	}
	else{
		console.log("adding new usermode to "+message.member.user.username);
		user_modes.push({username: message.member.user.username, mode: usermode});
	}
}
function modeIsSet(message){
	for(i = 0; i < user_modes.length; i++){
		if(user_modes[i].username == message.member.user.username){
			return true;
		}
	}
	return false;
}

function updateGroupsList(){
	fs.exists("home/events.json", function(exists){
		if(exists){
			fs.readFile('home/events.json', (err, data) => {
				try{
					var jObject = JSON.parse(data); 
					events = jObject;
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
	
}

function updateLoadoutsList(){
	fs.exists("home/loadouts.json", function(exists){
		if(exists){
			fs.readFile('home/loadouts.json', (err, data) => {
				try{
					var jObject = JSON.parse(data); 
					loadouts = jObject;
				}
				catch(err){
					console.log(err)
				}
				
			});
			
		}
		else{
			console.log("loadouts file does not exist.");
		}
		
	});
}
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

function isNumber(n){
	return !isNaN(parseFloat(n)) && isFinite(n);
}
//type is from https://www.bungie.net/Platform/Content/GetContentType/News/, 
//couldn't be bothered figuring out how to extend the Destiny-Client library to accept 
//the Content platform and the Destiny platform, so I'm just going to implement it here. 
//Endpoint was completely undocumented so this was a pain to figure out.
function sendNews(type, lang, message){
	var base_options = {
		url: 'https://www.bungie.net/Platform/Content/Site/News/'+type+"/"+lang+"/",
		headers: {
			'X-API-KEY': APIKEY
		}
	}
	
	request(base_options, function(error, response, body){
		if(!error && response.statusCode == 200){
			var response = JSON.parse(body);
			var twab = response.Response.results[0];
			
			var title = twab.properties.Title + " - "+twab.author.displayName;
			var sub = twab.properties.Subtitle;
			var banner = twab.properties.FrontPageBanner;
			var link = "http://www.bungie.net/en/News/Article/"+twab.contentId+"/";
			var content_prev = striptags(twab.properties.Content).slice(0, 245)+"...";
			console.log(title+"\n"+sub+"\n"+banner);
			
			var embed = new Discord.RichEmbed()
				.setTitle(title)
				.setDescription(sub+"\n\n"+content_prev)
				.setImage("http://www.bungie.net"+banner)
				.setURL(link)
				.setColor(0x5182d1)
				.setThumbnail("http://www.bungie.net/img/profile/avatars/shield2.jpg");
			message.channel.sendEmbed(embed);
		}
		else{
			console.log(error);
		}
	});
}
function getTwitch(message, channel) {

    var baseoptions = {
        url: 'https://api.twitch.tv/kraken/streams/seraphimelite1',
        headers: {
            'Accept': 'application/vnd.twitchtv.v3+json',
            'Client-ID': '4nl43m7wvaltcly6fsm921811950ij'
        }
    };
    
    request(baseoptions, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var channel = JSON.parse(body);
            var stream = channel.stream;
            var embed = new Discord.RichEmbed()
                .setTitle("Seraphim Elite Twitch Channel")
            if (stream == null) {
				var channeloptions = {
					url: 'https://api.twitch.tv/kraken/channels/seraphimelite1',
						headers: {
							'Accept': 'application/vnd.twitchtv.v3+json',
							'Client-ID': '4nl43m7wvaltcly6fsm921811950ij'
						}
				};
				
				request(channeloptions, function (error, response, body){
					var whole_channel = JSON.parse(body);
					var id = whole_channel._id;
					console.log(id);
					
					var host_options = {
						url: "http://tmi.twitch.tv/hosts?include_logins=1&host="+id
					};
					request(host_options, function(error, response, body){
						var hostedValue = JSON.parse(body);
						console.log(hostedValue);
						if(hostedValue.hosts[0].host_login == hostedValue.hosts[0].target_login){
							embed.setDescription("No one is streaming currently... \nhttps://www.twitch.tv/seraphimelite1")
							embed.setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/seraphimelite1-profile_image-4830ebfdb113f773-300x300.png");
							embed.setURL("https://www.twitch.tv/seraphimelite1");
							message.channel.sendEmbed(embed);
						}
						else{
							embed.setDescription("Hosting: "+hostedValue.hosts[0].target_display_name+"\nhttps://www.twitch.tv/"+hostedValue.hosts[0].target_login);
							embed.setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/seraphimelite1-profile_image-4830ebfdb113f773-300x300.png");
							var hostedoptions = {
								url: 'https://api.twitch.tv/kraken/streams/'+hostedValue.hosts[0].target_login,
									headers: {
										'Accept': 'application/vnd.twitchtv.v3+json',
										'Client-ID': '4nl43m7wvaltcly6fsm921811950ij'
									}
								};
							request(hostedoptions, function(error, response, body){
								var channel = JSON.parse(body);
								var image_link = channel.profile_banner;
								console.log(">"+channel.stream);
								if(channel.stream == null){
									embed.setDescription("No one is streaming currently... \nhttps://www.twitch.tv/seraphimelite1")
									embed.setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/seraphimelite1-profile_image-4830ebfdb113f773-300x300.png");
									embed.setURL("https://www.twitch.tv/seraphimelite1");
									message.channel.sendEmbed(embed);
									return;
								}
								//console.log("OH OH");
								console.log(channel.stream.preview.large);
								embed.setImage(channel.stream.preview.large);
								message.channel.sendEmbed(embed);
							});
							
						}
					});
				});
                
            }
            else {
				console.log(stream);
                var title = stream.channel.status;
				embed.setTitle(title);
				embed.setDescription("Game: "+stream.game+"\nhttps://www.twitch.tv/seraphimelite1");
				embed.setImage(stream.preview.large);
				embed.setThumbnail("https://static-cdn.jtvnw.net/jtv_user_pictures/seraphimelite1-profile_image-4830ebfdb113f773-300x300.png");
                embed.setURL("https://www.twitch.tv/seraphimelite1");
				message.channel.sendEmbed(embed);
            }
			
        }
        else if (!error) {
            console.log(response);
        }
    });
}
function getGroups(username){
	var return_events = [];
	for(i = 0; i < events.length; i++){
		var event = events[i];
		if(event.players.contains(username)){
			return_events.push(event);
		}
		
	}
	return return_events;
}

function getLinker(discordName){
	for(i = 0; i < linked_users.length; i++){
		
		if(linked_users[i].discordName == discordName) return linked_users[i];
	}
	return "FAIL";
}

function countMembers(object){
	var i = 0;
	for(prop in object){
		if(object.hasOwnProperty(prop)){
			i++;
		}
	}
	return i;
}

function setupManifest(message, callback){
	var unzip = require('unzip');
	var req_url = "https://www.bungie.net/platform/destiny/manifest/";
	var options = {
		headers: {
			'X-API-KEY': APIKEY
		},
		url: req_url
	};	
	
	request(options, function(error, response, body){
		var Manifest = JSON.parse(body);
		var Ver = Manifest.Response.version;
		console.log(Manifest);

		if(Ver != last_manifest_version){
			console.log("Version mismatch, updating...");
			message.channel.sendMessage("Updating Manifest...");
			var manifest_url = "http://www.bungie.net/"+Manifest.Response.mobileWorldContentPaths.en;
			exec('wget '+manifest_url, function (error, stdout, stderr) {
				last_manifest_version = Ver;
				var stream = fs.createReadStream(path.basename(manifest_url));
				message.channel.sendMessage("Extracting Manifest...");
				stream.pipe(unzip.Extract({ path: 'manifest' }));
				stream.on('close', () => {
					message.channel.sendMessage("Extracting Records table from database...");
					fs.unlink("./records.json");
					exec('sqlite-json manifest/'+path.basename(manifest_url)+' --table DestinyRecordDefinition -o records.json', function (error, stdout, stderr){
						updateRecordsList();
						callback({done: true});
					});
				});
			});
		}
		else{
			callback({done: true});
		}
	});
}

function getRecordBook(linker, recordBookId, callback){
	var membershipId = linker.destinyId;
	var refreshToken = linker.refreshToken;
	if(!linker.refreshToken){
		callback("no_token");
	}
	refreshAccessToken(membershipId, refreshToken, (result, token) => {
		var accessToken = "";
		if(result == "tokenokay"){
			accessToken = linker.token;
		}
		else if(result == "tokenupdated"){
			accessToken = token;
		}
		else{
			console.log("Invalid result from token refresh.")
			return;
		}
		console.log("Using Access Token: "+accessToken);
		console.log("Getting book: "+recordBookId);
		var options = {
			headers: {
				'X-API-KEY': APIKEY,
				'Authorization': 'Bearer '+accessToken
			},
			url: 'https://www.bungie.net/Platform/Destiny/2/MyAccount/RecordBooks/'+recordBookId+'/Completion/'
		}
		request(options, function (error, response, body){
			var jObj = JSON.parse(body);
			console.log(jObj);
			callback(jObj.Response.data.isComplete);
		});
	});
	//var accessToken = (refChecker == -1) ? linker.token : refChecker;
	
}

function refreshAccessToken(membershipId, refreshT, callback){
	console.log("Refreshing with: "+refreshT);
	var options = {
		headers: {
			'X-API-Key': APIKEY
		},
		url: 'https://www.bungie.net/Platform/App/GetAccessTokensFromRefreshToken/',
		body: JSON.stringify({refreshToken: refreshT})
	};
	request.post(options, function(error, response, body){
		var response = JSON.parse(body);
		var errorCode = response.ErrorCode;
		console.log(errorCode);
		if(errorCode == '2110'){
			//refresh token is not valid yet:
			console.log("Access code does not need to be updated yet.")
			callback("tokenokay", "");
		}
		else if(errorCode == '1'){
			//success:
			console.log(body);
			var newAccessToken = response.Response.accessToken.value;
			var newRefreshToken = response.Response.refreshToken.value;
			
			for(i = 0; i < linked_users.length; i++){
				var linker = linked_users[i];
				if(linker.destinyId == membershipId){
					var new_linker = linked_users[i];
					new_linker.token = newAccessToken;
					new_linker.refreshToken = newRefreshToken;
					linked_users[i] = new_linker;
					updateLinksJSON();
					callback("tokenupdated", newAccessToken);
				}
			}
		}
		
	});
}
 
function setupLoadout(loadout, char_id, linker){
	//we want to skip the subclass, so we start at 1:
	//Every thing is so wrong with this, I don't even know.
	for(i = 1; i < loadout.items.length; i++){
		var item = loadout.items[i];
		if(item.characterId != char_id){
			//first we need to equip a new item so that we can move our item to the vault, incase it's equipped on the character, this part doesn't work:
			destiny.Inventory({
				membershipType: 2,
				membershipId: loadout.owner,
				characterId: item.characterId
			}).then(res => {
				console.log(res);
				var slot = inv.buckets.Equippable[i].items;
				var replacement_insId = slot[0].itemInstanceId == item.itemId ? slot[1].itemInstanceId : slot[0].itemInstanceId;
				var options = {
					headers: {
						'X-API-KEY': APIKEY,
						'Authorization': 'Bearer '+linker.token
					},
					url: 'https://www.bungie.net/platform/Destiny/EquipItem/',
					body: JSON.stringify({membershipType: 2, itemId: replacement_insId, characterId: item.characterId})
				};
				request.post(options, function(error, response, body){
					console.log("ITEM SWAP: "+response);
					var payload = {
						itemReferenceHash: item.itemId,
						stackSize: 0,
						transferToVault: false,
						itemId: item.itemHash,
						characterId: item.characterId,
						membershipType: 2
					};
					console.log("refHash: "+item.itemHash);
					console.log("insId: "+item.itemId);
					console.log("charId: "+char_id);
					
					var options = {
						headers: {
							'X-API-KEY': APIKEY,
							'Authorization': 'Bearer '+linker.token
						},
						url: 'https://www.bungie.net/Platform/Destiny/TransferItem/',
						body: JSON.stringify({membershipType: 2, itemReferenceHash: item.itemHash, itemId: item.itemId, stackSize: 1, characterId: item.characterId, transferToVault: true})
						//body: JSON.stringify({itemReferenceHash: String(item.itemId), stackSize: 0, transferToVault: false, itemId: String(item.itemHash), characterId: String(item.characterId), membershipType: 2})
					};
					console.log("Moving item to vault: "+item.itemId);
					request.post(options, function(error, response, body){
						console.log(response.body);
					});
				});
			});
			
			
			
		}
		else{
			console.log("User is on correct character")
		}
	}
}
function sendCommandError(message, issue, example){
	message.channel.sendMessage("I was unable to process the command: ```diff\n"+message.content+"``` Because "+issue+". Here is an example:\n```\n"+example+"\n```");
}
function isBotCommander(input){
	//console.log(input.member.roles);
	return input.member.roles.exists('name', 'Bot Commander')
			
}

function getId(input){
	return input.id;
}

function hasRole(message, roleName){
	return message.member.roles.exists('name', roleName)
}

function getRoleById(id){
	
}

function allAre(value, list){
	for(i = 0; i < list.length; i++){
		if(list[i] != value){
			return false;
		}
	}
	return true;
}
function fileExists(file){
	fs.stat(file, function(err, stat){
		if(err == null){
			return true;
		}
		else {
			return false;
		}
	});
}
function random (low, high) {
    return Math.random() * (high - low) + low;
}

function groupHasSherpas(group){
	var sherpaRole;
	client.channels.array().forEach((channel) => {
		if(channel.name == "general"){
			sherpaRole = channel.guild.roles.find('name', 'Sherpa');
		}
		
	});
	console.log(sherpaRole);
	
	group.players.forEach((player) => {
		var user = findUserNoMsg(player);
		if(user){
			user._roles.forEach((role) => {
				console.log(role + " : "+sherpaRole.id);
				if(role == sherpaRole.id){
					console.log("Found Sherpa.");
					return true;
				}
			});
		}
	});
}
function hasModPerms(input) {
	try{
		var modPerms = [ "MANAGE_MESSAGES", "MANAGE_ROLES_OR_PERMISSIONS" ];
		var mod = input.member.permissions.hasPermissions(modPerms, true);
		return mod;
		
	}
	catch(err){
		console.log(err.message);
	}

} 

function getChallengeModes(recruitmentId){
	var i = 0;
	for(i = 0; i < raid_map.length; i++){
		if(raid_map[i].name == recruitmentId){
			return raid_map[i].c_modes;
		}
	}
}

function getRaidColor(recruitmentId){
	var i = 0;
	for(i = 0; i < raid_map.length; i++){
		if(raid_map[i].name == recruitmentId){
			return raid_map[i].color;
		}
	}
}

function getRaidIcon(recruitmentId){
	var i = 0;
	for(i = 0; i < raid_map.length; i++){
		if(raid_map[i].name == recruitmentId){
			return raid_map[i].icon;
		}
	}
}

function getChannel(name){
	return client.channels.find(cha => cha.name === name);
}

function _getCallerFile() {
    try {
        var err = new Error();
        var callerfile;
        var currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if(currentfile !== callerfile) return callerfile;
        }
    } catch (err) {}
    return undefined;
}

/*function generateEventCountdown(event, callback){
	var time = require('time');
	var startTime = event.startTime;
	var mer = startTime[startTime.length - 2] + startTime[startTime.length - 1];
	console.log(mer);
	var timeZone = event.timeZone;
	
	if(timeZone[1] == "S" && timeZone != "DST" && timeZone != "HST"){
		timeZone = timeZone.setCharAt(1, "D");
	}
	console.log(timeZone);
	var date = event.date;
	
	if(mer != "pm" && mer != "am" && mer != "PM" && mer && "AM"){
		return " A countdown is not avaliable for this group because there was no valid PM/AM";
	}
	fs.readFile(__dirname+'/timezones.json', function(err, data){
		if(err) throw err;
		var timezones = JSON.parse(data);
		for(i = 0; i < timezones.length; i++){
			if(timezones[i]['abbr'] == timeZone){
				console.log(timezones[i].utc[0]);
				var city = timezones[i].utc[0];
				var now = new time.Date(); //right now.
				now.setTimezone(timezones[i].utc[0]); //set timezone to first city in list this doesn't work, time doesn't change. 
				console.log(now.toString());
				callback(timezones[i].value + ", City: "+timezones[i].utc[0] + ", Text: "+timezones[i].text);
			}
		}
	});
	
}*/