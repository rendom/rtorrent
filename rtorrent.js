var net = require('net');
var parseXmlString = require('xml2js').parseString;

var rTorrent = function(socket){
	this.socket = socket;
};

rTorrent.prototype.call = function(method, params, callback) {
	var client	= net.connect({path: this.socket});
	var t		= this;
	var buffer	= "";
	var content = this.buildXml(method, params);
	var header	= [
		"CONTENT_LENGTH"+String.fromCharCode(0)+ content.length + String.fromCharCode(0),
		"SCGI"+String.fromCharCode(0)+"1" + String.fromCharCode(0)
	];

	client.on('connect', function(){
		t.write(client, header, content);
	});
	client.on('data', function(data){
		buffer+=data;
	});
	client.on('end', function(data){
		buffer = buffer.replace(/[\w\d\:\/\s-]+/, '');
		parseXmlString(buffer, function(err, data){
			if(err) callback(err, null);
			else callback(false, data);
		});
	});
	client.on('error', function(err) {
		callback(err, null);
	});
};


rTorrent.prototype.write = function(client, header, content) {
	client.write((header[0].length+header[1].length)+':');
	client.write(header[0]);
	client.write(header[1]);
	client.write(',');
	client.write(content);
};

rTorrent.prototype.buildXml = function(method, params){
	var xml="";
	xml += "<methodCall>";
	xml+= "<methodName>"+method+"</methodName>";
	
	if( params && params.length > 0) {
		xml += "<params>";
		for(var i=0; i<params.length; i++){
			xml += "<param><value>"+params[i]+"</value></param>";
		}
		xml += "</params>";
	}

	xml += "</methodCall>";
	return xml;
};

var r = new rTorrent('/x/x/rtorrent.socket');
r.call('system.client_version', [], function(err, d){
	console.log(d);
});
