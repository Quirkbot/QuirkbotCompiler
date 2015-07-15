"use strict";

var utils = require('./utils');
var pass = utils.pass;
var execSync = require('child_process').execSync;
var database = require('./database');
var cluster = require('cluster');

/**
 * Setup the correct compiler toolchain
 */
var toolchainOs = process.env.TOOLCHAIN_OS || 'linux';
execSync('sh setup-'+toolchainOs+'.sh')

/**
 * Clean up temporary directory and precompile Quirkbot header
 **/
execSync('rm -r .tmp; mkdir .tmp');
execSync('cd compiler/firmware; sh prepare.sh');

var numCPUs = require('os').cpus().length;
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

			console.log('ask', message.data.worker)
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
		console.log('do', fork.label, instance.id)
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
			console.log('push', fork.label)
			doJob(fork)
		})
	})

	setTimeout(pushJobs, 100);
}
setTimeout(pushJobs, 0);


cluster.on('exit', function(worker, code, signal) {
	console.log('worker ' + worker.process.pid + ' died');
});
