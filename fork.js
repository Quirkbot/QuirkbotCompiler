"use strict";

// Utils -----------------------------------------------------------------------
var utils = require('./utils');
var pass = utils.pass;
var execute = utils.execute;
var writeFile = utils.writeFile;
var readFile = utils.readFile;
var readDir = utils.readDir;
var mkdir = utils.mkdir;

// Startup ---------------------------------------------------------------------

// Interface -------------------------------------------------------------------
var label;
var run = function(id, code){
	if(typeof label === 'undefined' || typeof id === 'undefined' ) return;
	//console.log('run', label, id)
	var sketch = {
		_id: id,
		code: code
	}
	pass(sketch)
	.then(build)
	.then(function(){
		console.log('success', label, id)
		process.send({
			type: 'success',
			data:{
				worker: label,
				id: sketch._id,
				hex: sketch.hex,
				error: sketch.error
			}
		})
	})
	.catch(function(){
		console.log('fail', label, id, arguments)
		process.send({
			type: 'fail',
			data:{
				worker: label,
				id: sketch._id,
				hex: sketch.hex,
				error: sketch.error
			}
		})
	})
}
process.on('message', function(message) {
	if(message.type == 'label'){
		label = message.data;
	}
	else if(message.type == 'run'){
		run(message.data.id,message.data.code);
	}
});

// Level0 ----------------------------------------------------------------------
var build = function(sketch){
	var promise = function(resolve, reject){
		pass(sketch)
		.then(compileProcess)
		.then(clear)
		.then(resolve)
		.catch(reject)
	}
	return new Promise(promise)
}
// Level1 ----------------------------------------------------------------------
var compileProcess = function(sketch){
	var promise = function(resolve, reject){
		pass(sketch)
		.then(create)
		.then(compile)
		.then(link)
		.then(objCopy)
		.then(readFile('.tmp/'+sketch._id +'.hex'))
		.then(function(hex){
			sketch.hex = hex;
			resolve(sketch)
		})
		.catch(function(error){
			sketch.error = error;
			resolve(sketch)
		})
	};
	return new Promise(promise);
}
var clear = function(sketch){
	var promise = function(resolve, reject){
		execute('rm .tmp/' + sketch._id + '.ino;')()
		execute('rm .tmp/' + sketch._id + '.hex;')()
		execute('rm .tmp/' + sketch._id + '.o')()
		execute('rm .tmp/' + sketch._id + '.elf')()
		execute('rm .tmp/' + sketch._id + '.d')()

		resolve(sketch);
	};
	return new Promise(promise);
}
// Level1 ----------------------------------------------------------------------
var create = function(sketch){
	var promise = function(resolve, reject){
		pass()
		.then(writeFile('.tmp/' +sketch._id + '.ino', sketch.code)())
		.then(function(){
			resolve(sketch)
		})
		.catch(reject)
	}
	return new Promise(promise);
}
var compile = function(sketch){
	var promise = function(resolve, reject){
		pass()
		.then(execute('compiler/arduino/hardware/tools/avr/bin/avr-g++ -w -x c++ -c -ffunction-sections -fno-exceptions -fdata-sections -Os -MMD -mmcu=atmega32u4 -DF_CPU=8000000L -DARDUINO=10605 -DARDUINO_AVR_QUIRKBOT -DARDUINO_ARCH_AVR -DUSB_VID=0x2886 -DUSB_PID=0xf005 -DUSB_MANUFACTURER="Seeedstudio" -DUSB_PRODUCT="Quirkbot" -D__PROG_TYPES_COMPAT__ -Icompiler/firmware/build-quirkbot/libs/Quirkbot .tmp/'+sketch._id+'.ino -o .tmp/'+sketch._id+'.o'))
		.then(function(){
			resolve(sketch)
		})
		.catch(reject)
	}
	return new Promise(promise);
}
var link = function(sketch){
	var promise = function(resolve, reject){
		pass()
		.then(execute('compiler/arduino/hardware/tools/avr/bin/avr-gcc -mmcu=atmega32u4 -Wl,--gc-sections -Os -o .tmp/'+sketch._id+'.elf .tmp/'+sketch._id+'.o compiler/firmware/build-quirkbot/libcore.a  -lc -lm'))
		.then(function(){
			resolve(sketch)
		})
		.catch(reject)
	}
	return new Promise(promise);
}
var objCopy = function(sketch){
	var payload = arguments;

	var promise = function(resolve, reject){
		pass()
		.then(execute('compiler/arduino/hardware/tools/avr/bin/avr-objcopy -O ihex -R .eeprom .tmp/'+sketch._id+'.elf .tmp/'+sketch._id+'.hex'))
		.then(function(){
			resolve(sketch)
		})
		.catch(reject)
	}
	return new Promise(promise);
}
