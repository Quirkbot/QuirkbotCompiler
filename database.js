"use strict";

var mongoose = require('mongoose');
var mongooseUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/quirkbot-compiler'

var connectMongoose = function(url){
	mongoose.connect(url, function (err, res) {
		if (err) {
			console.log ('MONGOOSE: Error connecting to ' + url + ' : ' + err);
			setTimeout(function () {
				connectMongoose(url)
			}, 3000);
		} else {
			console.log ('MONGOOSE: Succeeded to connect to ' + url);
		}
	});
}
connectMongoose(mongooseUrl);

// Model to store programs
var ProgramSchema = new mongoose.Schema({
	createdAt: {
		type: Date,
		default: Date.now
	},
	code: {
		type: String
	},
	hex: {
		type: String
	},
	error: {
		type: String
	},
	pending: {
		type: Boolean,
		default: true
	},
	ready: {
		type: Boolean,
		default: false
	}
});
var ProgramModel = mongoose.model('ProgramModel', ProgramSchema);



exports.create = function(code){
	var promise = function(resolve, reject){
		var instance = new ProgramModel({
			code: code
		});
		instance.save(function(error){
			if(error) console.log(error)
		});
		resolve(instance.id);
	}
	return new Promise(promise);
}
exports.countPending = function(){
	var promise = function(resolve, reject){
		ProgramModel.count({ pending: true, ready: false }, function (error, count) {
			if(error) resolve(0);
			else resolve(count)
		});
	}
	return new Promise(promise);
}
exports.getNext = function(){
	var promise = function(resolve, reject){
		ProgramModel.findOneAndUpdate(
			{pending: true},
			{pending: false},
			{
				sort:{createdAt: 1}
			},
			function (error, instance) {
				if(!error && instance){
					resolve(instance);
				}
				else reject('No pending requests')
			}
		)
	}
	return new Promise(promise);
}
exports.setReady = function(id, hex, error){
	var promise = function(resolve, reject){
		ProgramModel.findByIdAndUpdate(
			id,
			{
				ready: true,
				hex: hex,
				error: error
			},
			function (error, instance) {}
		)
		resolve(id);
	}
	return new Promise(promise);
}
exports.extract = function(id){
	var promise = function(resolve, reject){
		ProgramModel.findById(
			id,
			function (error, instance) {
				if(!error && instance){
					resolve(instance);
				}
				else reject('Cannot extract '+id, error)
			}
		);
	}
	return new Promise(promise);
}
exports.clearOld = function(interval){
	interval = interval || 300000;
	var promise = function(resolve, reject){
		ProgramModel.where('createdAt').lte(Date.now() - interval)
		.remove(function(error){
			if(error) reject(error);
			else resolve();
		})
	}
	return new Promise(promise);
}
exports.truncate = function(id){
	var promise = function(resolve, reject){
		ProgramModel.remove({}, function(error) {
			if(error) reject(error);
			else resolve();
		});
	}
	return new Promise(promise);
}


////////////////////////////////////////////////////////////////////////////////
// Model to store generic keypar value
var ConfigSchema = new mongoose.Schema({
	key: {
		type: String
	},
	value: {
		type: String
	}
});
var ConfigModel = mongoose.model('ConfigModel', ConfigSchema);

exports.setConfig = function(key, value){
	var promise = function(resolve, reject){
		ConfigModel.findOneAndUpdate(
			{
				key: key
			},
			{
				key: key,
				value: value
			},
			function (error, instance) {
				if(!error && instance){
					resolve(instance);
				}
				else {
					var instance = new ConfigModel({
						key: key,
						value: value
					});
					instance.save(function(error){
						if(error) console.log(error)
					});
					resolve(instance);
				}
			}
		)
	}
	return new Promise(promise);
}

exports.getConfig = function(key){
	var promise = function(resolve, reject){
		ConfigModel.findOne(
			{
				key: key
			},
			function (error, instance) {
				if(!error && instance){
					resolve(instance);
				}
				else {
					console.log(error)
					reject(error);
				}
			}
		)
	}
	return new Promise(promise);
}
