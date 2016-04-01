var basePath = __dirname + "/../";
var config = {};

var uuid = require('node-uuid');

// - DIRECTORIES
config.directories = {
	home: basePath,
	plugins: basePath + '/lib/plugins',
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
var demoPlugin = {
	name: 'demoPlugin',
	file: basePath + 'lib/plugins/DemoPlugin'
};

config.plugins.push(demoPlugin);
config.demoPlugin = {
	// plugin config goes here
	itWorksConfig: "Hello it works :)"
};

module.exports = config;
