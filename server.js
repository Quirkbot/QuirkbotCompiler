"use strict";

var throng = require('throng');
var utils = require('./utils');
var pass = utils.pass;
var execute = utils.execute;
var delay = utils.delay;

var http = require('http');
var database = require('./database');



/**
 * Starts the webserver
 *
 * The webserver will act on 3 types of request. One that includes the program
 * source code to be added to the compilation queue, one that checks for the
 * result of the compilation process, and one for generic config retrival
 *
 * The source code should be provided direcly as the URL payload, eg:
 * http://{host}:{port}/{url-encoded-source-code}
 *
 * The compilation result should be requested by providing the compilation id as
 * the URL payload, prepended by the char 'i', eg:
 * http://{host}:{port}/i{compilation-id}
*
 * Generic configs should be requested by providing the config key
 * the URL payload, prepended by the char 'c', eg:
 * http://{host}:{port}/c{config-key}
 */
var start = function () {
	var port = process.env.PORT || 8080;
	var server = http.createServer(function (request, response) {
		response.setHeader("Access-Control-Allow-Origin", "*");


		if(request.url.length === 1){
			indexRequest(request, response);
		}
		else if(request.url.charAt(1) === 'i'){
			resultRequest(request, response);
		}
		else if(request.url.charAt(1) === 'c'){
			configRequest(request, response);
		}
		else{
			queueRequest(request, response);
		}
	});
	server.listen(port);
	console.log('Serving on port '+port);
}
throng(start, {
  workers: process.env.WEB_CONCURRENCY || require('os').cpus().length,
  lifetime: Infinity
});

/**
 * Index
 *
 * Provides meta info about the compiler
 */
var indexRequest = function(request, response){
	response.writeHead(200, {'Content-Type': 'application/json'});
	response.end(JSON.stringify({
		message: 'Quirkbot compiler',
		endpoints:[
			{
				'/{source-code}': 'Queues code for compilation'
			},
			{
				'/i{compilation-id}': 'Retrieves info of an ongoing compilation.'
			},
			{
				'/c{config-key}': 'Retrieves value of a generic configuration by key.'
			},
			{
				'/cfirmware-reset': 'A valid HEX that will reset the Quirkbot to the factory settings.'
			},
			{
				'/clibrary-info': 'The content of the library.properties of the current Quirkbot library.'
			},
			{
				'/hardware-info': 'The content of the version.txt of the current Quirkbot board definition.'
			}
		]

	}));
}
/**
 * Compilation queue handle
 *
 * Extracts the source code out of the request URL payload, and pipes it to the
 * queue process.
 *
 * On success, a response with status code 200 will be provided, alongside with
 * the compilation id for future reference.
 *
 * On error, a response with status code 403 will be provided, alongside with
 * the compiled error message.
 */
var queueRequest = function(request, response){
	var code;
	try{
		code = decodeURIComponent(request.url.substr(1))
	}
	catch(e){}

	var sketch = {
		code: code
	}

	pass(sketch)
	.then(queue)
	.then(function(sketch){
		delete sketch.code;
		response.writeHead(200, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(sketch));
	})
	.catch(function(sketch){
		delete sketch.code;
		response.writeHead(403, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(sketch));
	})
}
var queue = function(sketch){
	var promise = function(resolve, reject){
		pass(sketch)
		.then(validate)
		.then(create)
		.then(resolve)
		.catch(reject)

	}
	return new Promise(promise)
}
var validate = function(sketch){
	var promise = function(resolve, reject){

		var doReject = function(){
			sketch.error = 'Invalid Quirkbot program';
			reject(sketch)
		}

		if(sketch.code.indexOf('"Quirkbot.h"') == -1){
			return doReject();
		}

		resolve(sketch)
	};

	return new Promise(promise);
}
var create = function(sketch){
	var promise = function(resolve, reject){
		database.create(sketch.code)
		.then(function(id){
			sketch._id = id;
			resolve(sketch)
		})

	};

	return new Promise(promise);
}
/**
 * Compilation result handle
 *
 * Extracts the id out of the request URL payload, and pipes it to the result
 * request process
 *
 * On success, a response with status code 200 will be provided, alongside with
 * the compiled hex code.
 *
 * On error, a response with status code 403 will be provided, alongside with
 * the compiled error message.
 */
var resultRequest = function(request, response){

	var sketch = {
		_id: request.url.substr(2)
	}

	pass(sketch)
	.then(getResult)
	.then(function(sketch){
		response.writeHead(200, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(sketch));
	})
	.catch(function(sketch){
		response.writeHead(403, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(sketch));
	})
}
var getResult = function(sketch){
	var promise = function(resolve, reject){
		if(!sketch._id){
			return resolve(sketch);
		}

		database.extract(sketch._id)
		.then(resolve)
		.catch(function(error){
			console.log(error, sketch)
			reject(sketch);
		})
	}
	return new Promise(promise)
}
/**
 * Config handle
 *
 * Extracts the key out of the request URL payload, and pipes it to the result
 * request process
 *
 * On success, a response with status code 200 will be provided, alongside with
 * config object
 *
 * On error, a response with status code 403 will be provided, alongside with
 * an compiled error message.
 */
var configRequest = function(request, response){
	var key = request.url.substr(2);
	database.getConfig(key)
	.then(function(config){
		response.writeHead(200, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(config));
	})
	.catch(function(error){
		response.writeHead(403, {'Content-Type': 'application/json'});
		response.end(JSON.stringify(error));
	})
}
/**
 * Recursive Database cleanup routine
 *
 * Every 10 seconds request the database to delete entries that are created more
 * that 15 seconds ago. This means that if a program's hex is not requested
 * within 15 seconds, it will be discarted.
 **/
var cleanOldEntries = function(){
	database.clearOld(15000)
	.then(delay(10000))
	.then(cleanOldEntries)
	.catch(function(){
		pass()
		.then(delay(10000))
		.then(cleanOldEntries)
	})
}
setTimeout(cleanOldEntries,0);
