var http = require('http');
var querystring = require('querystring');
module.exports = {
	getElo: function(id, callback){
		
		return http.get("http://api.guardian.gg/elo/"+id+"/", function(response) {
			var body = '';
			response.on('data', function(d) {
				body += d;
			});
			response.on('end', function(){
				
				var parsed = JSON.parse(body);
				var elos = [];
				for(i = 0; i < parsed.length; i++){
					var gamemode = parsed[i];
					elos.push(gamemode.elo);
				}
				elos.sort(function(a, b) {return a - b; });
				//console.log(elos[elos.length - 1]);
				var elo = parseInt(elos[elos.length - 1]);
				console.log(elo);
				return callback(elo);
			});
		});
		
		
	},
	getEloChart: function(id, callback){
		return http.get("http://api.guardian.gg/chart/elo/"+id, function(response){
			var body = '';
			response.on('data', function(d){
				body += d;
			});
			response.on('end', function(){
				var parsed = JSON.parse(body);
				return callback(parsed);
			});
		});
	}
}