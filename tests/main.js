var SERVER = "https://quirkbot-compiler.herokuapp.com";
//var SERVER = "http://localhost:8080";

var _request = function(url){
	return function(){
		var payload = arguments;
		var promise = function(resolve, reject){
			var headers = {}

			var start = Date.now();
			$.ajax({
				url: url,
				success : function (e, status, req) {
					var end = Date.now();
					var _e = e;
					if(! getParameterByName('text')){
						_e = JSON.stringify(e,null, "\t");
					}
					if(!getParameterByName('silent')){
						console.log('%cREQUEST', 'background: #0A0; color: #fff');
						console.log(url);
						console.log('%clatency: ' + (end - start), 'color: #999');
						console.log(_e)
					}

					resolve(e)

				},
				error: function (e, status, req) {
					var end = Date.now();
					var _e = e;
					if(! getParameterByName('text')){
						_e = JSON.stringify(e,null, "\t");
					}
					if(!getParameterByName('silent')){
						console.log('%cREQUEST', 'background: #A00; color: #fff');
						console.log(url);
						console.log('%clatency: ' + (end - start), 'color: #999');
						console.log(_e)
					}
					resolve(e)
				}
			});
		}
		return new Promise(promise);
	}

}
var request = function(url, instant){
	return function(){
		var payload = arguments;

		var promise = function(resolve, reject){
			pass()
			.then(_request(url))
			.then(function(){
				if(!instant) resolve.apply(null, arguments)
			})

			if(instant) resolve.apply(null, payload)
		}
		return new Promise(promise);
	}

}
var requestProgram = function(url, instant){
	return function(){

		var promise = function(resolve, reject){
			pass()
			.then(request(url + '/%23include%20"Quirkbot.h"%0A%0ALed%20led%3B%0AWave%20wave%3B%0A%0Avoid%20start()%7B%0A%09led.place%20%3D%20LE%3B%0A%09wave.out.connect(led.in)%3B%0A%7D%0A', instant))
			.then(resolve)
		}
		return new Promise(promise);
	};
}
var requestProgramCC = function(instant){

	return function(){
		var payload = arguments;

		var promise = function(resolve, reject){
			pass()
			.then(requestProgram(SERVER, instant))
			.then(resolve)
		}
		return new Promise(promise);
	};
}
var requestResult = function(id, instant){
	return function(){

		var promise = function(resolve, reject){
			pass()
			.then(request(SERVER + '/i' + id, instant))
			.then(resolve)
		}
		return new Promise(promise);
	};
}
var requestResultFromResponse = function(instant){
	return function(response){
		var promise = function(resolve, reject){
			if(!response._id){
				return reject('fail')
			}
			pass()
			.then(requestResult(response._id, instant))
			.then(resolve)
		}
		return new Promise(promise);
	};
}
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
var pass = function(){
	var payload = arguments;
	var promise = function(resolve, reject){
		resolve.apply(null, payload);
	}
	return new Promise(promise);
}
var log = function(){
	var payload = arguments;
	var promise = function(resolve, reject){
		for (var i = 0; i < payload.length; i++) {
			console.log(payload[i])
		};
		resolve.apply(null, payload);
	}
	return new Promise(promise);
}
var delay = function(millis){
	return function(){
		var payload = arguments;
		var promise = function(resolve, reject){
			setTimeout(function(){
				resolve.apply(null, payload);
			}, millis)

		}
		return new Promise(promise);
	}
}
