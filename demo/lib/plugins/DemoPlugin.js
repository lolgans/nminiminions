var q = require('q');
var Promise = q.Promise;

var plugin = {
	name: 'demoPlugin',
	init: init,
	config: null
};

/**
 * Initialize the plugin
 */
function init() {
	log.info('loaded plugin: ' + plugin.name);
	plugin.config = app.config[plugin.name];
	return Promise(
		function (resolve, reject) {
			log.info('initializing plugin: ' + plugin.name);
			q(true)
			.then(
				doSth
			).then(
				doSthElse
			).then(
				function () {
					resolve(plugin);
				}
			).catch(
				function (error) {
					reject(error);
				}
			)
		}
	)
}

function doSth() {
	return Promise(
		function (resolve, reject) {
			console.log(plugin.config.itWorksConfig);
			resolve(true);
		}
	)
}

function doSthElse() {
	return Promise(
		function (resolve, reject) {
			resolve(true);
		}
	)
}

/**
 *
 * @type {{name: string, init: init, config: null}}
 */
module.exports = plugin;