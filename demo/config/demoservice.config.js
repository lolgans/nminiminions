var basePath = __dirname + "/../";
var config = {};

var uuid = require('node-uuid');

// - DIRECTORIES
config.directories = {
	home: basePath,
	plugins: basePath + '/plugins',
	config: basePath + '/config',
	logs: basePath + '/logs'
};

// - ID & NAME
config.id = 'ChannelController_'+ uuid.v1();
config.name = 'ChannelController';
config.shortcut = 'CC';

// - PLUGINS
config.plugins = [];

//ChannelController-Plugin
var channelController = {
	name: 'channelController',
	file: basePath + '/plugins/ChannelController'
};

config.plugins.push(channelController);
config.channelController = {
	// plugin config goes here
};

module.exports = config;
