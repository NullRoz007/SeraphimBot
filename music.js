const YoutubeDL = require('youtube-dl');
const Request = require('request');
const Discord = require('discord.js');

module.exports = function(client, c_name, options){
	MAX_QUEUE_SIZE = 20;
	PREFIX = '!';
	let queue = [];
	let voice_channel = getVoiceChannel();
	let dispatcher;
	let isReady = true;	

	client.on('message', (msg) => {
		if (msg.channel.name != options.channel && options.channel){return;}
		const message = msg.content.trim();
		if(message.startsWith(PREFIX)){
			const command = message.split(' ')[0];
			var msg_split = message.split(' '); msg_split.shift();
			const suffix = flatten(msg_split, ' ');
			if(command == PREFIX+"play") { 
				if(queue.length == MAX_QUEUE_SIZE) {msg.reply("I can't play that song because the queue is full."); return;}
				if(!isReady) {msg.reply("Please wait for the next song to load before queuing another one."); return;}
				
				isReady = false;
				connect(voice_channel); 
				searchVideo(suffix, msg);
			}
			else if(command == PREFIX+"skip"){
				dispatcher.end();
			}
			else if(command == PREFIX+"pause"){
				dispatcher.pause();
			}
			else if(command == PREFIX+"resume"){
				dispatcher.resume();
			}
			else if(command == PREFIX+"clearqueue"){
				queue = [];
				killConnection();
				isReady = true;
				
				console.log(queue);
			}
			else if(command == PREFIX+"queue"){
				var output = "Songs: \n";
				var i = 1;
				queue.forEach((song) => {
					if(i == 1) {output += "**Now Playing:**"}
					else {output += i+"): "}
					output += song.fulltitle+"\n";
					i++;
				});
				
				msg.channel.sendMessage(output);
			}	
			else if(command == PREFIX+"destroy"){
				isReady = true;
				destroy();
				
			}
		}
	});
	function searchVideo(suffix, message){
		if(!String(suffix).startsWith('http')){
			suffix = "gvsearch1:"+suffix;
		}
		
		console.log("Fetching: "+suffix);
		YoutubeDL.getInfo(suffix, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
			if(err) return error;
			queue.push(info);
			message.channel.sendMessage("Queuing: "+info.fulltitle);
			isReady = true;	
			if(queue.length == 1){runQueue(queue)}
		});
		
	}
	
	function runQueue(queue){
		var video = queue[0];
		var connection = client.voiceConnections.first();
		var stream = Request(video.url);
		
		dispatcher = connection.playStream(stream, { seek: 0, volume: 1 });
		dispatcher.on('error', () => {queue.shift(); runQueue(queue); isReady = true;});
		dispatcher.on('end', ()=> {queue.shift(); if(queue.length > 0) {runQueue(queue) } else { killConnection();}});
	}
	
	function killConnection(){
		console.log("Killing voice connection....");
		dispatcher.end();
		var connection = client.voiceConnections.first();
		connection.disconnect();
	}
	
	function getVoiceChannel(){
		var ret_c;
		client.channels.forEach(channel => {
			if(channel.type == 'voice'){
				if(channel.name == c_name){
					console.log(channel.name);
					ret_c = channel;
				}
			}
		});
		return ret_c; 
	}
	
	function connect(channel, msg, callback){
		console.log(channel);
		if(client.voiceConnections[0]) {return client.voiceConnections[0]}
		channel.join(connection => {return connection}).catch((err)=>{msg.channel.sendMessage(err)});
		console.log("Connected to voice channel.");
	}
	
	function destroy(){
		queue = [];
		killConnection();
	}
};

function flatten(str_array, separator){
	var str = "";
	var i = 0;
	str_array.forEach(s => {
		str += s + separator;
	});
	return str.trim();
}

