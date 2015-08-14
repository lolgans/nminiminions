var Promise = require('q').Promise;

var plugin = {
	resources: {}
};
module.exports = plugin;


plugin.init = function(app) {
	log.info('initializing plugin: resourceAnnouncer');
	// creates a publisher
	plugin.publisher = app.mqs.resourceAnnouncer;
	plugin.announceInterval = setInterval(plugin.announceResource, app.config.resourceAnnouncer.announceInterval);
	app.events.on(
		'resourceAnnounce',
		plugin.updateResources
	);
	plugin.announceResource();
	return plugin;
};


plugin.updateResources = function(data) {
	if( plugin.resources[data.plugin] ) {
		var resource = plugin.resources[data.plugin];
		for( var method in data.definition ) {
			var endpoints = data.definition[method];
			if( resource[method] ) {
				for( var key in endpoints ) {
					resource[method][key] = endpoints[key];
				}
			} else {
				resource[method] = endpoints;
			}
		}
	} else {
		plugin.resources[data.plugin] = data.definition;
	}
	return this.resources;
};


plugin.announceResource = function() {
	return Promise(
		function(resolve, reject) {
			var a = plugin.publisher.publish(
				{
					resources: plugin.resources
				},
				{
					expiration: '1000'
				},
				function() {
					resolve(a);
				}
			);
		}
	).then(
		log.debug.bind(log, 'resource announcement sent!')
	).catch(
		log.error.bind(log, 'resource announcement FAILED!')
	);
};
