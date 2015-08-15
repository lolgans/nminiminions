var nids = require('nids');
var Q = require('q');
var Promise = Q.Promise;

var plugin = {
	name: 'rpcApiCall'
};
module.exports = plugin;


plugin.init = function() {
	log.info('loaded plugin: ' + plugin.name);
	return Promise(
		function(resolve, reject) {
			plugin.config = app.config[plugin.name];
			log.info('initializing plugin: ' + plugin.name);
			plugin.publisher = app.mqs.rpcApiCall;
			app.queryAPI = plugin.apiQueryWrapper(plugin.publisher);
			resolve(plugin);
		}
	);
};


/*
example

	app.queryAPI('mu', 'users', 'GET', 'byId', { _id: '4f39e4f12ce81f09340002b9' }, {})
	.then(
		function(result) {
			log.info('=========== queryAPI RESULT =======', result);
		}
	)
	.catch(
		function(error) {
			log.error('=========== queryAPI ERROR =======', error);
		}
	)

*/


/**
 * queryAPI example
 * will send a rpc-based api query and handle it as a promise.
 * @param {string} realm - the realm in which to execute the query
 * @param {string} resource - the resource for  the query
 * @param {string} method - the method for the query
 * @param {string} specifier - the specifier for the query
 * @param {object} document: usually parameters for the db query/action layer. see api documentation
 * @param {object} options: additional options for the action. see api documentation
*/

plugin.apiQueryWrapper = function(publisher) {
	return function(realm, resource, method, specifier, document, options) {
		var data = {
			message: {
				realm: realm,
				resource: resource,
				method: method,
				specifier: specifier,
				clientId: nids.ClientId.create('-' + app.config.shortcut),
				document: document,
				options: options || {}		
			}
		};
		return Promise(
			function(resolve, reject) {
				publisher.rpc.call(
					app.config.rpcApiCall.rpcRoute,
					JSON.stringify(data),
					function(answer) {
						if (answer.errors !== null) {
							return reject(answer.errors);
						}
						return resolve(answer.results);
					}
				);
			}
		);
	}
};

