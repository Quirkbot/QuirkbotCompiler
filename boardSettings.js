"use strict";

exports.settings = {};
var fs = require('fs');
var file = fs.readFileSync('compiler/arduino/hardware/arduino/avr/boards.txt').toString();
var lines = file.split('\n');
lines.forEach(function (line) {
	var parts = line.split('=');
	if(parts.length === 2){
		var key = parts[0];
		var value =  parts[1];
		exports.settings[key] = value;
	}
});
