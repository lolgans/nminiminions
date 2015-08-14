var BunyanFormat = require('bunyan-format');
var config = {};


// --- BASICS; id should be 'unique' (for multiple instances), name general  (logging, ...)
config.id = 'echo_' + Date.now();
config.name = 'echo';


// --- DIRECTORIES
config.directories = {
	home: process.cwd(),
	plugins: process.cwd() + '/lib/plugins',
	config: process.cwd() + '/config',
	logs: process.cwd() + '/logs',
};


// --- PLUGINS
config.plugins = [
	'pushMessages',
	'resourceAnnouncer',
	'rpcApiCall'
];


// --- BASIC bunyan logger options
config.logOutStream = BunyanFormat({ outputMode: 'short' });


// --- ECHO PLUGIN ... 
config.plugins.push(
	{
		name: 'echo',
		file: config.directories.plugins + '/echo.js'
	}
);
config.echo = {
	rpcListeningRoute: 'echo'
};
config.mqs.echo = {
	name: 'echo_' +  config.id,
	queueName: config.id + '_' + UUID,
	subscriptionRoutingKey: config.id + '_' + UUID,				
	server: {
		host: '127.0.0.1',
		port: 5672,
		login: 'cheergg',
		password: 'cgg@rmq'
	},
	exchange: {
		name: 'amq.topic',
		type: 'topic'
	}
};

module.exports = config;

