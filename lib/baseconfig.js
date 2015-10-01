var BunyanFormat = require('bunyan-format');
var logOutStream = BunyanFormat({ outputMode: 'short' });
var UUID = require('node-uuid').v4();

module.exports = function(config) {
	var baseConfig = {};

	// Application id
	if (typeof config.id !== 'string') {
		config.id = 'nminion_' + UUID;
		log.warn('you should specify "config.id" to be a unique service identifier in you network!');
	}
	// Application name
	if (typeof config.name !== 'string') {
		config.name = 'nminions based service ' + UUID;
		log.warn('you should specify "config.name" to be a identifier for your service in you network!');
	}
	if (typeof config.directories !== 'object') {	// --- DIRECTORIES
		baseConfig.directories = {}
		log.warn('you should specify "config.directories" to make your skeleton informative to your plugins!');
	}
	if (typeof config.directories.home !== 'string') {
		config.directories.home = process.cwd();
	}
	if (typeof config.directories.plugins !== 'string') {
		config.directories.plugins = process.cwd() + '/lib/plugins';
	}
	if (typeof config.directories.config !== 'string') {
		config.directories.config = process.cwd() + '/config';
	}
	if (typeof config.directories.logs !== 'string') {
		config.directories.logs = process.cwd()+ '/logs';
	}
	// --- Application shortcut (4 letters)
	if (typeof config.shortcut !== 'string') {
		config.shortcut = '????';
		log.warn('you should specify "config.shortcut" to as a 4-letter string to identify your app as a api client!');
	}
	// Application plugins
	if (typeof config.plugins !== 'object' && Array.isArray(config.plugins) !== true) {
		// Application plugins
		config.plugins = [];
		log.warn('you should specify "config.plugins" to as a Array and add your plugins to it!');
	}
	// --- LOGGER === BUNYAN
	if (typeof config.logger !== 'object') {
		config.logger = { 
			name: config.name,
			streams: [
				// {
					// level: 'debug',
					// path: config.directories.logs + '/nminions.debug.log',
				// },
				{
					level: 'warn',
					path: config.directories.logs + '/nminions.error.log'
				},
				{
					level: 'debug',
					stream: logOutStream
				}
			]
		};
	}
	// --- BASIC nrmq setup
	if (typeof config.mqs !== 'object') {
		config.mqs = {	};
	}
		
	// --- rpcApiCall
	var rpcApiCallIndex = config.plugins.indexOf('rpcApiCall');
	if (rpcApiCallIndex > -1) {
		config.plugins.splice(rpcApiCallIndex, 1);			
		config.plugins.push(
			{
				name: 'rpcApiCall',
				file: __dirname + '/plugins/rpcApiCall.js'
			}
		);
		if (typeof config.rpcApiCall !== 'object') {
			config.rpcApiCall = {};
		}
		if (typeof config.rpcApiCall.rpcRoute === 'undefined') {
			config.rpcApiCall.rpcRoute = 'APICALL';
		}
		if (typeof config.mqs.rpcRoute === 'undefined') {
			config.mqs.rpcApiCall = {
				name: 'rpcApiCall_' +  config.id,
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
		}
	}
	// --- RESOURCE RECEIVER
	var resourceReceiverIndex = config.plugins.indexOf('resourceReceiver');
	if (resourceReceiverIndex > -1) {
		config.plugins.splice(resourceReceiverIndex, 1);			
		config.plugins.push(
			{
				name: 'resourceReceiver',
				file: __dirname + '/plugins/resourceReceiver.js'
			}
		);
		config.resourceReceiver = {
			announceInterval: 5000,
			announceActive: true,
			receiveActive: true,
			EXCHANGE: {
				name: 'n-announcements',
				type: 'fanout'
			}
		};
		config.mqs.resourceReceiver = {
			name: 'resourceReceiver_' +  config.id,
			queueName: config.id + '_' + UUID,
			subscriptionRoutingKey: config.id + '_' + UUID,				
			server: {
				host: '127.0.0.1',
				port: 5672,
				login: 'cheergg',
				password: 'cgg@rmq'
			},
			exchange: {
				name: 'amq.fanout',
				type: 'fanout'
			}
		};
	}	
	// --- RESOURCE ANNOUNCER
	var resourceAnnouncerIndex = config.plugins.indexOf('resourceAnnouncer');
	if (resourceAnnouncerIndex > -1) {
		config.plugins.splice(resourceAnnouncerIndex, 1);			
		config.plugins.push(
			{
				name: 'resourceAnnouncer',
				file: __dirname + '/plugins/resourceAnnouncer.js'
			}
		);
		config.resourceAnnouncer = {
			announceInterval: 5000,
			announceActive: true,
			receiveActive: true,
			EXCHANGE: {
				name: 'n-announcements',
				type: 'fanout'
			}
		};
		config.mqs.resourceAnnouncer = {
			name: 'resourceAnnouncer_' +  config.id,
			queueName: config.id + '_' + UUID,
			subscriptionRoutingKey: config.id + '_' + UUID,				
			server: {
				host: '127.0.0.1',
				port: 5672,
				login: 'cheergg',
				password: 'cgg@rmq'
			},
			exchange: {
				name: 'amq.fanout',
				type: 'fanout'
			}
		};
	}
	// --- pushMessages
	var pushMessagesIndex = config.plugins.indexOf('pushMessages');
	if (pushMessagesIndex > -1) {
		config.plugins.splice(pushMessagesIndex, 1);			
		config.plugins.push(
			{
				name: 'pushMessages',
				file: __dirname + '/plugins/pushMessages.js'
			}
		);
		config.pushMessages = {
			routing: 'pushMessages',
			EXCHANGE: {
				name: 'n-pushMessages',
				type: 'fanout'
			}
		};
		config.mqs.pushMessages = {
			name: 'pushMessages_' +  config.id,
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
	}
	return config;
};

