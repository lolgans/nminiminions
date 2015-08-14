var Promise = require('q').Promise;

var plugin = {};
module.exports = plugin;

/**
	this plugin allows your microservice to push messages to clients connected (via websocket) to any api-server (= connection endpoint).
	app.events.emit(
		'pushMessage',
		{
			foo: 'bar'
		},
		'userId',
		'123456'
	);
	app.pushMessage(
		{
			foo: 'bar'
		},
		'userId',
		'123456'
	);
*/
plugin.init = function() {
	var config = app.config.pushMessages;
	log.info('initializing plugin: pushMessages');
	plugin.publisher = app.mqs.pushMessages;
	app.events.on(
		'pushMessage', 
		function( content, mode, target ) {
			pushMessage(content, mode, target);
		}
	);
	app.pushMessage = pushMessage;
	return plugin;
};


/*
// sends the message to all websocket-connected users that are guests (not logged in).
app.pushMessage({ foo: 'bar', 'userId', '000000000000000000000001');

*/


/**
 * pushMessage example
 * Pushes a message to a (set of) api-websocket client(s) based on a mode and target.
 * @param {Object} content
 * @param {string} mode: defines the delivery mode from api-nodes to clients. possible values are:
 * "userId" : bases propagation/pushing of the message on the user._id of a connection. All clients connected as the same user will get the message.
 * "connection": bases propagation/pushing of the message on the connection id. only ONE connection will get the message.
 * "channel":  bases propagation/pushing of the message on the websocket's joined channels. all websocket connections in that channel will receive the message.
 * @param {string} target: the stringified id/channelName (depending on the mode) that is used for delivery matching.
*/
function pushMessage(content, mode, target) {
	var payload = {
		source: app.config.id,
		timestamp: Date.now(),
		mode: mode,
		content: content,
		target: target
	};
	return Promise(
		function(resolve, reject) {
			var a = plugin.publisher.publish(
				payload, 
				{ expiration: '5000' },
				function() {
					resolve(a);
				}
			);
		}
	).then(
		log.info.bind(log, 'pushMessage sent!')
	).catch(
		log.error.bind(log, 'pushMessage FAILED send!')
	);
};