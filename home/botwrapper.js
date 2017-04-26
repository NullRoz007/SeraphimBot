
function getStatus(){
	console.log("Getting Status...");
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", "http://seraphimbot.mod.bz/", false);
	xmlHttp.send(null);
	//console.log(xmlHttp.responseText);
	var res = xmlHttp.responseText;
	var json = JSON.parse(res);
	document.getElementById("status").innerHTML = "Status: "+json.status;
	console.log(json.status);
}

function getGroups(){
	console.log("Getting Groups...")
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", "http://seraphimbot.mod.bz/groups/", false);
	xmlHttp.send(null);
	//console.log(xmlHttp.responseText);
	var res = xmlHttp.responseText;
	var json = JSON.parse(res);
	var eventString = "Groups: \n";
	for(i = 0; i < json.length; i++){
		eventString += json[i].id+". "+json[i].name + " (" + json[i].startTime + "-" + json[i].timeZone+")<br>";
	}
	document.getElementById("groups").innerHTML = eventString;
	console.log(json[0].name);
}