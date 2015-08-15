var Promise = require('q').Promise;

						// if (typeof item.resourceDefinition === 'function') {
							// log.debug('======== annoucer for ', item);
							// var definition = item.resourceDefinition();
							// app.events.emit(
								// 'resourceAnnounce',
								// {
									// resource: item.name,
									// definition: definition
								// }
							// );
						// }
						
var plugin = {
	name: 'resourceAnnouncer',
	resources: {}
};
module.exports = plugin;


plugin.init = function() {
	log.info('loaded plugin: ' + plugin.name);
	return Promise(
		function(resolve, reject) {
			// creates a publisher
			plugin.config = app.config[plugin.name];
			log.info('initializing plugin: ' + plugin.name);
			plugin.publisher = app.mqs.resourceAnnouncer;
			plugin.announceInterval = setInterval(plugin.announceResource, app.config.resourceAnnouncer.announceInterval);
			app.events.on(
				'resourceAnnounce',
				plugin.updateResources
			);
			plugin.announceResource();
			resolve(plugin);
		}
	);
};


plugin.updateResources = function(data) {
	log.debug('=======updateResources', data);
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
			log.debug('=======announceResource', plugin.resources);
			var a = plugin.publisher.publish(
				app.config.shortcut + '.resourceAnnounce',
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
