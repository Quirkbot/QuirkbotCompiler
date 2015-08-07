"use strict";
var cluster = require('cluster');
if (cluster.isMaster){
	require('./master');
}
else{
	require('./fork');
}
