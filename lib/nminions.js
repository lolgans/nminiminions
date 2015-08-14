var path = require('path');
var Q = require('q'); 
var Promise = Q.Promise;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var argv = require('minimist')(process.argv.slice(2));
var bunyan = require('bunyan');
global.log = console;
var app = {};
global.app = app;
app.pmx = require('pmx').init(
	{
		errors: false,
		http: false
	}
);
var NRMQ = require('nrmq');


app._data = {};
app.events = new EventEmitter();
// TODO: fix path!
app.packageJson = require(__dirname + '/../package.json');
app.start = start;
app.stop = stop;
app.errorHandler = errorHandler;
process.on('uncaughtException', app.errorHandler);
process.on('SIGTERM', app.stop.bind(this));
process.on('SIGINT', app.stop.bind(this));
app.get = function(parentKey, childKey) {
	return app._data[parentKey][childKey];
};
app.set = function(parentKey, childKey, value) {
	if (!app._data[parentKey]) {
		app._data[parentKey] = {};
	}
	app._data[parentKey][childKey] = value;
	return app._data[parentKey][childKey];
};



function start(startupPromisesToChain) {
	return Promise(
		function(startupResolve, startupReject) {
			var init = Q(true)
			.then(
				loadConfig
			).then(
				function() {
					// Shortcut to the app name
					app.config = require(__dirname + '/baseconfig.js')(app.config);
					app.name = app.config.name;
					return app.config;
				}
			).then(
				function() {
					log = bunyan.createLogger(app.config.logger);
					log.info('logger active: bunyan');
					return log;
				}
			).then(
				function() {
					app.mqs = {};
					var connections = [];
					for (var n in app.config.mqs) {
						connections.push(mqConnectionPromise(n));
					}
					return Q.all(connections);
				}
			).then(
				function() {
					return load('plugins', app.config.plugins);
				}
			).then(
				function() {
					return pmx_actions();
				}
			).then(
				function() {
					log.info('init complete. v' + app.packageJson.version);
					app.events.emit('init.complete', app);
					startupResolve(app);
					return true;
				}
			).then(
				function() {
					log.info('running startupPromisesToChain :' + startupPromisesToChain.length);
					return chainPromises('startupPromisesToChain', startupPromisesToChain);
				}
			).catch(
				function(err) {
					startupReject(err);
					errorHandler(err);
				}
			);
		}
	);
};



function stop() {
	log.info('service shutdown triggered - 2sec max | ' + Date.now() + '');
	setTimeout(
		function() {
			process.disconnect && process.disconnect();
			process.exit(1);
		},
		2000
	);
};



// -------- HELPERS
//--[[ load the config file
function loadConfig() {
	try {
		var configArgument = argv.config || argv.c || argv._[0];
		var configPath = path.resolve(process.cwd(), configArgument);
		app.config = require(configPath);
	} catch(err) {
		console.error('! failed to load config [%s]', configPath);
		app.errorHandler(err);
		process.exit(1);
	}
	log.info('loaded config [' + configPath + ']');
	return true;
};


//--[[ turns a nrmq connection/instantiation call into a promise
function mqConnectionPromise(id) {
	Promise(
		function(resolve, reject) {
			app.mqs[id] = NRMQ(
				app.config.mqs[id].name, 
				app.config.mqs[id].server, 
				app.config.mqs[id].exchange, 
				app.config.mqs[id].subscriptionRoutingKey,
				app.config.mqs[id].queueName
			);
			app.mqs[id].on('connectionReady', function() { resolve(id); });
			app.mqs[id].on('err', function() { reject(err); });
		}
	);
};


//--[[ load all plugins and wait for their init to complete
function load(name, list) {
	app[name] = {};
	return Promise(
		function(loadResolve, loadReject) {
			log.info('loading ' + name);
			if (typeof list !== 'object' || typeof list.length !== 'number' || list.length <1) {
				return loadResolve('nothing to load');
			}
			var result = Q(false).catch(app.errorHandler);
			list.map(
				function(item) {
					var r = require(item.file);
					app[name][item.name] = r.init(item);
					if (typeof item.resourceDefinition === 'function') {
						var definition = item.resourceDefinition();
						// Announce Resource
						app.events.emit(
							'resourceAnnounce',
							{
								resource: item.name,
								definition: definition
							}
						);
					}
					return item;
				}
			).concat(
				[
					function() {
						log.info('completed loading ' + name);
						loadResolve(app[name]);
					}
				]
			).reduce(Q.when, result);
			return result;
		}
	);
};



function errorHandler(err) {
	console.error('============ UNCAUGHT EXCEPTION ============');
	console.error(err.stack);
	// pmx.notify(err);
	return err;
};



function chainPromises(name, list) {
	return Promise(
		function(chainResolve, chainReject) {
			var result = Q(false).catch(
				function(err) {
					log.error('chainPromises error ', err);
					chainReject(err);
					app.errorHandler(err);
				}
			);
			list.unshift(
				function() {
					log.info('chainPromises start ' + name);
				}
			);
			list.push(
				function() {
					log.info('chainPromises complete ' + name);
					chainResolve(result);
				}
			).reduce(Q.when, result);
			return result;
		}
	);
};


module.exports = app;




function pmx_actions() {
	pmx.action(
		'printConfig', 
		function(reply) {
			reply(app.config);
		}
	);
	return true;
};

