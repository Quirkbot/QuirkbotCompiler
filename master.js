"use strict";

var utils = require('./utils');
var pass = utils.pass;
var readFile = utils.readFile;
var execSync = require('child_process').execSync;
var database = require('./database');
var cluster = require('cluster');
var boardSettings = require('./boardSettings').settings;


/**
 * Clean up temporary directory
 **/
execSync('rm -r .tmp; mkdir .tmp');
/**
 * Save configs regarding the library and hardware info
 **/
pass()
.then(readFile('compiler/arduino/libraries/Quirkbot/library.properties'))
.then(function (info) {
	database.setConfig('library-info',info);
})
.catch(function (error) {
	console.log('Error saving library-info.', error);
})
pass()
.then(readFile('compiler/arduino/hardware/arduino/avr/version.txt'))
.then(function (info) {
	database.setConfig('hardware-info',info);
})
.catch(function (error) {
	console.log('Error saving hardware-info.', error);
})
/**
 * Compile the reset firmware and save the hex to the config database
 **/
execSync('cd compiler/firmware; make clean; make;');
pass()
.then(readFile('compiler/firmware/build-quirkbot/firmware.hex'))
.then(function (hex) {
	database.setConfig('firmware-reset',hex);
})
.catch(function (error) {
	console.log('Error saving reset firmware.', error);
})
/**
 * Precompile Quirkbot header
 **/
execSync(
	'compiler/arduino/hardware/tools/avr/bin/avr-g++ '+
	'-g ' +
	'-Os ' +
	'-w ' +
	'-ffunction-sections ' +
	'-fno-exceptions ' +
	'-fdata-sections ' +
	'-fno-threadsafe-statics ' +
	'-MMD ' +
	'-mmcu='+boardSettings['quirkbot.build.mcu']+' ' +
	'-DF_CPU='+boardSettings['quirkbot.build.f_cpu']+' ' +
	'-DARDUINO_'+boardSettings['quirkbot.build.board']+' ' +
	'-DARDUINO=10606 ' +
	'-DARDUINO_ARCH_AVR ' +
	'-DUSB_VID='+boardSettings['quirkbot.build.vid']+' ' +
	'-DUSB_PID='+boardSettings['quirkbot.build.pid']+' ' +
	'-DUSB_MANUFACTURER='+boardSettings['quirkbot.build.usb_manufacturer']+' ' +
	'-DUSB_PRODUCT='+boardSettings['quirkbot.build.usb_product']+' ' +
	((boardSettings['quirkbot.build.core']) ?
		'-Icompiler/arduino/hardware/arduino/avr/cores/'+boardSettings['quirkbot.build.core']+' ' : '') +
	((boardSettings['quirkbot.build.variant']) ?
		'-Icompiler/arduino/hardware/arduino/avr/variants/'+boardSettings['quirkbot.build.variant']+' ' : '') +
	'-Icompiler/arduino/libraries/Quirkbot ' +
	'compiler/arduino/libraries/Quirkbot/Quirkbot.h ' +
	'-o compiler/firmware/build-quirkbot/libs/Quirkbot/Quirkbot.h.gch'
);

var numCPUs = process.env.WEB_CONCURRENCY || require('os').cpus().length;
console.log('Number of CPUs: '+ numCPUs);
var forks = [];
for (var i = 0; i < numCPUs; i++) {

	var fork = {};
	forks[i] = fork;
	fork.label = i;
	fork.free = true;
	fork.process = cluster.fork();

	fork.process.on('message', function(message) {
		if(message.type == 'success'){
			database.setReady(message.data.id, message.data.hex, message.data.error);

			//console.log('ask', message.data.worker)
			var fork = forks[message.data.worker];
			fork.free = true;
			doJob(fork);
		}
	});

	fork.process.send({
		type: 'label',
		data: i
	})

}

var doJob = function(fork){
	database.getNext()
	.then(function(instance){
		//console.log('do', fork.label, instance.id)
		fork.free = false;
		fork.process.send({
			type: 'run',
			data: {
				id: instance.id,
				code: instance.code
			}
		})
	})
}

var pushJobs = function(){
	database.countPending()
	.then(function(count){
		if(!count) return;
		var pushes = 0;
		forks.forEach(function(fork){
			if(pushes >= count) return;
			if(!fork.free) return;
			pushes++;
			//console.log('push', fork.label)
			doJob(fork)
		})
	})

	setTimeout(pushJobs, 100);
}
setTimeout(pushJobs, 0);


cluster.on('exit', function(worker, code, signal) {
	console.log('worker ' + worker.process.pid + ' died');
});
