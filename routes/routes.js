const fs = require('fs');
var path = require('path');
var appRouter = function(app){
	app.get("/", function(req, res){
		return res.send({"status": "online"});
	});
	app.get("/home", function(req, res){
		res.sendFile(path.join(__dirname+'/../home/index.html'));
	});
	app.get("/home/groups", function(req, res){
		res.sendFile(path.join(__dirname+'/../home/groups.html'));
	});
	app.get("/home/botwrapper.js", function(req, res){
		res.sendFile(path.join(__dirname+'/../home/botwrapper.js'));
	});
	app.get("/home/events", function(req, res){
		res.sendFile(path.join(__dirname+'/../home/events.json'));
	});
	app.get("/home/links", function(req, res){
		res.sendFile(path.join(__dirname+'/../home/links.json'));
	});
	app.get("/home/fixed-menu.css", function(req, res){
		res.sendFile(path.join(__dirname+'/../home/fixed-menu.css'));
	});
	app.get("/linkhelp", function(req, res){
	});
	app.get("/chart/generate/:hash/", function(req, res){
		var hash = req.params['hash'];
		var jsonData = "";
		var editedHTML = "TEST";
		fs.readFile(hash+".json", function(err, data){
			if(err){
				console.log(err);
			}
			else{
				console.log(data);
				jsonData = data;
			}
			res.writeHeader(200, {"ContentType": "text/html"});
			fs.readFile("chartnp.html", function(err, data){
				if(err){
					console.log(err);
				}
				else{
					var stringhtml = String(data);
					console.log(">: "+editedHTML);
					editedHTML = stringhtml.replace("X_DATA_PLACEHOLDER_X", "google.visualization.arrayToDataTable("+jsonData+");");
				}
			});
			res.write(editedHTML)
		});
		res.end();
		//fs.unlink(path.join(__dirname+"/../"+hash+".json"));	
	});

}

module.exports = appRouter;